/**
 * WhatsApp Webhook Handler Service
 * Processes incoming webhooks from WhatsApp Cloud API
 */

import { AppDataSource } from '../config/database';
import { Contact } from '../models/Contact';
import { Message } from '../models/Message';
import { WebhookLog } from '../models/WebhookLog';
import { MessageStatusUpdate } from '../models/MessageStatusUpdate';
import { PhoneNumber } from '../models/PhoneNumber';
import { WhatsAppMessagingService } from './whatsapp-messaging.service';
import { WhatsAppMediaService } from './whatsapp-media.service';

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: any[];
        messages?: any[];
        statuses?: any[];
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppWebhookService {
  /**
   * Process incoming webhook
   */
  static async processWebhook(payload: WhatsAppWebhookPayload, headers: any, ip: string): Promise<void> {
    const startTime = Date.now();
    
    // Generate idempotency key from payload
    const idempotencyKey = this.generateIdempotencyKey(payload);
    
    // Check if webhook already processed
    const webhookLogRepo = AppDataSource.getRepository(WebhookLog);
    const existingLog = await webhookLogRepo.findOne({ where: { idempotencyKey } });
    
    if (existingLog && existingLog.processingStatus === 'success') {
      console.log(`Webhook already processed: ${idempotencyKey}`);
      return;
    }

    // Create webhook log
    const webhookLog = webhookLogRepo.create({
      eventType: payload.entry[0]?.changes[0]?.field || 'unknown',
      webhookPayload: payload,
      processingStatus: 'processing',
      requestHeaders: headers,
      requestIp: ip,
      requestUserAgent: headers['user-agent'],
      idempotencyKey,
      receivedAt: new Date(),
    });

    await webhookLogRepo.save(webhookLog);

    try {
      // Process each entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const { value, field } = change;

          if (field === 'messages') {
            // Process messages
            if (value.messages) {
              for (const message of value.messages) {
                await this.processIncomingMessage(message, value.metadata, webhookLog.id);
              }
            }

            // Process status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                await this.processStatusUpdate(status, webhookLog.id);
              }
            }
          }
        }
      }

      // Mark as success
      webhookLog.processingStatus = 'success';
      webhookLog.processedAt = new Date();
      webhookLog.processingDurationMs = Date.now() - startTime;
      await webhookLogRepo.save(webhookLog);

    } catch (error: any) {
      // Mark as failed
      webhookLog.processingStatus = 'failed';
      webhookLog.processedAt = new Date();
      webhookLog.processingDurationMs = Date.now() - startTime;
      webhookLog.errorMessage = error.message;
      webhookLog.errorStack = error.stack;
      await webhookLogRepo.save(webhookLog);
      
      throw error;
    }
  }

  /**
   * Process incoming message
   */
  private static async processIncomingMessage(
    messageData: any,
    metadata: any,
    webhookLogId: string
  ): Promise<void> {
    const contactRepo = AppDataSource.getRepository(Contact);
    const messageRepo = AppDataSource.getRepository(Message);
    const webhookLogRepo = AppDataSource.getRepository(WebhookLog);

    // Get or create contact
    let contact = await contactRepo.findOne({ where: { waId: messageData.from } });
    
    if (!contact) {
      contact = contactRepo.create({
        waId: messageData.from,
        phoneNumber: messageData.from,
        profileName: messageData.from, // Will be updated if we get profile info
      });
      await contactRepo.save(contact);
    }

    // Update session tracking (customer sent message)
    const messageTimestamp = new Date(parseInt(messageData.timestamp) * 1000);
    await WhatsAppMessagingService.updateCustomerSession(contact.id, messageTimestamp);

    // Store message
    const message = messageRepo.create({
      wamid: messageData.id,
      phoneNumberId: metadata.phone_number_id,
      contactId: contact.id,
      direction: 'incoming',
      messageType: messageData.type,
      fromNumber: messageData.from,
      toNumber: metadata.phone_number_id,
      timestamp: messageTimestamp,
      rawPayload: messageData,
    });

    // Parse message content based on type
    switch (messageData.type) {
      case 'text':
        message.textBody = messageData.text?.body;
        break;
      
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
      case 'sticker':
        const mediaData = messageData[messageData.type];
        message.mediaId = mediaData?.id;
        message.mediaMimeType = mediaData?.mime_type;
        message.mediaSha256 = mediaData?.sha256;
        message.mediaCaption = mediaData?.caption;
        message.mediaFilename = mediaData?.filename;
        
        // Auto-download media and upload to S3
        if (mediaData?.id) {
          try {
            const phoneNumberRepo = AppDataSource.getRepository(PhoneNumber);
            const phoneNumber = await phoneNumberRepo.findOne({
              where: { phoneNumberId: metadata.phone_number_id },
            });

            if (phoneNumber) {
              const mediaResult = await WhatsAppMediaService.downloadAndStoreMedia({
                mediaId: mediaData.id,
                accessToken: phoneNumber.accessToken,
                phoneNumberId: metadata.phone_number_id,
                messageType: messageData.type,
                filename: mediaData.filename,
                contactWaId: contact.waId,
              });

              if (mediaResult) {
                message.mediaUrl = mediaResult.mediaUrl;
                message.mediaFileSize = mediaResult.mediaFileSize;
                console.log(`✅ Media stored: ${mediaResult.s3Path}`);
              }
            }
          } catch (error: any) {
            console.error('Failed to download media:', error);
          }
        }
        break;
      
      case 'location':
        message.locationLatitude = messageData.location?.latitude;
        message.locationLongitude = messageData.location?.longitude;
        message.locationName = messageData.location?.name;
        message.locationAddress = messageData.location?.address;
        break;
      
      case 'interactive':
        message.interactiveType = messageData.interactive?.type;
        message.interactivePayload = messageData.interactive;
        
        // Handle button reply
        if (messageData.interactive?.type === 'button_reply') {
          message.buttonPayload = messageData.interactive.button_reply?.id;
          message.buttonText = messageData.interactive.button_reply?.title;
        }
        break;
      
      case 'reaction':
        message.reactionMessageId = messageData.reaction?.message_id;
        message.reactionEmoji = messageData.reaction?.emoji;
        break;
      
      case 'contacts':
        message.contactsPayload = messageData.contacts;
        break;
    }

    // Handle context (reply to message)
    if (messageData.context) {
      message.contextMessageId = messageData.context.id;
      message.contextFrom = messageData.context.from;
    }

    await messageRepo.save(message);

    // Update webhook log with message reference
    await webhookLogRepo.update(webhookLogId, {
      messageId: message.id,
      contactId: contact.id,
      wamid: message.wamid,
      waId: contact.waId,
    });
  }

  /**
   * Process status update
   */
  private static async processStatusUpdate(statusData: any, webhookLogId: string): Promise<void> {
    const messageRepo = AppDataSource.getRepository(Message);
    const statusUpdateRepo = AppDataSource.getRepository(MessageStatusUpdate);
    const webhookLogRepo = AppDataSource.getRepository(WebhookLog);

    // Find message by wamid
    const message = await messageRepo.findOne({ where: { wamid: statusData.id } });
    
    if (!message) {
      console.warn(`Message not found for status update: ${statusData.id}`);
      return;
    }

    const statusTimestamp = new Date(parseInt(statusData.timestamp) * 1000);

    // Update message status
    await WhatsAppMessagingService.updateMessageStatus({
      wamid: statusData.id,
      status: statusData.status,
      timestamp: statusTimestamp,
      errorCode: statusData.errors?.[0]?.code,
      errorMessage: statusData.errors?.[0]?.title,
    });

    // Create status update history
    const statusUpdate = statusUpdateRepo.create({
      messageId: message.id,
      status: statusData.status,
      statusTimestamp,
      errorCode: statusData.errors?.[0]?.code,
      errorMessage: statusData.errors?.[0]?.title,
      rawPayload: statusData,
    });

    await statusUpdateRepo.save(statusUpdate);

    // Update webhook log
    await webhookLogRepo.update(webhookLogId, {
      messageId: message.id,
      wamid: statusData.id,
      statusEventType: statusData.status,
      statusTimestamp,
    });
  }

  /**
   * Generate idempotency key from payload
   */
  private static generateIdempotencyKey(payload: WhatsAppWebhookPayload): string {
    // Use first message/status ID + timestamp as idempotency key
    const entry = payload.entry[0];
    const change = entry?.changes[0];
    const value = change?.value;

    let key = `${entry?.id}_${change?.field}`;

    if (value?.messages && value.messages.length > 0) {
      key += `_${value.messages[0].id}`;
    } else if (value?.statuses && value.statuses.length > 0) {
      key += `_${value.statuses[0].id}_${value.statuses[0].status}`;
    }

    return key;
  }

  /**
   * Verify webhook signature (optional but recommended for production)
   */
  static verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }
}

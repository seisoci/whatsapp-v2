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
import { chatWebSocketManager } from './chat-websocket.service';

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
            // Pass contacts array to get profile info (optional)
                await this.processIncomingMessage(message, value.metadata, value.contacts || [], webhookLog.id);
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

      // Mark as success (use update to avoid overwriting fields set in processIncomingMessage/processStatusUpdate)
      await webhookLogRepo.update(webhookLog.id, {
        processingStatus: 'success',
        processedAt: new Date(),
        processingDurationMs: Date.now() - startTime,
      });

    } catch (error: any) {
      // Mark as failed (use update to avoid overwriting fields set in processIncomingMessage/processStatusUpdate)
      await webhookLogRepo.update(webhookLog.id, {
        processingStatus: 'failed',
        processedAt: new Date(),
        processingDurationMs: Date.now() - startTime,
        errorMessage: error.message,
        errorStack: error.stack,
      });

      throw error;
    }
  }

  /**
   * Process incoming message
   */
  private static async processIncomingMessage(
    messageData: any,
    metadata: any,
    contacts: any[], // WhatsApp sends contacts array with profile info
    webhookLogId: string
  ): Promise<void> {
    const contactRepo = AppDataSource.getRepository(Contact);
    const messageRepo = AppDataSource.getRepository(Message);
    const webhookLogRepo = AppDataSource.getRepository(WebhookLog);
    const phoneNumberRepo = AppDataSource.getRepository(PhoneNumber);

    // Get WhatsApp phone_number_id from metadata
    const whatsappPhoneNumberId = metadata.phone_number_id;
    
    // Lookup our PhoneNumber entity by WhatsApp's phone_number_id
    const phoneNumber = await phoneNumberRepo.findOne({
      where: { phoneNumberId: whatsappPhoneNumberId }
    });

    if (!phoneNumber) {
      console.warn(`Phone number not found for WhatsApp ID: ${whatsappPhoneNumberId}`);
      throw new Error(`Phone number ${whatsappPhoneNumberId} not registered in system`);
    }

    // Use our internal UUID
    const internalPhoneNumberId = phoneNumber.id;

    // Filter out unsupported message types
    if (messageData.type === 'unsupported') {
      console.warn('[WS] Received unsupported message type, skipping processing:', messageData);
      return;
    }

    // Extract contact info from contacts array (not from messageData.profile)
    const waId = messageData.from;
    const contactInfo = contacts?.find((c: any) => c.wa_id === waId);
    const profileName = contactInfo?.profile?.name || null;
    const profilePictureUrl = contactInfo?.profile_picture_url || null;

    // Download and store profile picture to S3 if available
    let s3ProfilePictureUrl: string | null = null;
    if (profilePictureUrl) {
      s3ProfilePictureUrl = await WhatsAppMediaService.downloadAndStoreProfilePicture({
        profilePictureUrl,
        contactWaId: waId,
        phoneNumberId: internalPhoneNumberId,
      });
    }

    // Get or create contact
    let contact = await contactRepo.findOne({ 
      where: { 
        waId: waId, 
        phoneNumberId: internalPhoneNumberId 
      } 
    });
    
    if (!contact) {
      contact = contactRepo.create({
        waId: waId,
        phoneNumber: messageData.from,
        phoneNumberId: internalPhoneNumberId,
        profileName: profileName || messageData.from,
        profilePictureUrl: s3ProfilePictureUrl, // Use S3 URL, not temp WhatsApp URL
      });
      await contactRepo.save(contact);
    } else {
      // Update profile name and picture if we have new info
      let updated = false;
      
      if (profileName && contact.profileName !== profileName) {
        contact.profileName = profileName;
        updated = true;
      }
      
      // Update profile picture if we successfully downloaded new one to S3
      if (s3ProfilePictureUrl && contact.profilePictureUrl !== s3ProfilePictureUrl) {
        contact.profilePictureUrl = s3ProfilePictureUrl;
        updated = true;
      }
      
      if (updated) {
        await contactRepo.save(contact);
      }
    }

    // Update session tracking (customer sent message)
    const messageTimestamp = new Date(parseInt(messageData.timestamp) * 1000);
    await WhatsAppMessagingService.updateCustomerSession(contact.id, messageTimestamp);

    // Store message
    const message = messageRepo.create({
      wamid: messageData.id,
      phoneNumberId: internalPhoneNumberId,
      contactId: contact.id,
      direction: 'incoming',
      messageType: messageData.type,
      fromNumber: messageData.from,
      toNumber: metadata.display_phone_number,
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

    // Update webhook log with message reference (use save instead of update for reliability)
    console.log('[DEBUG] Final webhook log update:', {
      webhookLogId,
      phoneNumberId: internalPhoneNumberId,
      messageId: message.id,
      contactId: contact.id,
      wamid: message.wamid,
      waId: contact.waId,
    });

    // Load the webhook log entity and update it properly
    const webhookLog = await webhookLogRepo.findOne({ where: { id: webhookLogId } });
    if (webhookLog) {
      webhookLog.phoneNumberId = internalPhoneNumberId;
      webhookLog.messageId = message.id;
      webhookLog.contactId = contact.id;
      webhookLog.wamid = message.wamid;
      webhookLog.waId = contact.waId;

      await webhookLogRepo.save(webhookLog);

      console.log('[DEBUG] Webhook log saved successfully:', {
        id: webhookLog.id,
        phoneNumberId: webhookLog.phoneNumberId,
        messageId: webhookLog.messageId,
        contactId: webhookLog.contactId,
        wamid: webhookLog.wamid,
        waId: webhookLog.waId,
      });
    } else {
      console.error('[ERROR] Webhook log not found for update:', webhookLogId);
    }

    // 📢 WEBSOCKET: Broadcast new message to all clients subscribed to this phone number
    console.log(`[WS] Broadcasting message:new for contact ${contact.id} to room ${internalPhoneNumberId}`);
    chatWebSocketManager.broadcast(internalPhoneNumberId, {
      type: 'message:new',
      data: {
        contactId: contact.id,
        contact: {
             lastCustomerMessageAt: contact.lastCustomerMessageAt,
             sessionExpiresAt: contact.sessionExpiresAt,
             isSessionActive: contact.isSessionActive, // Using the getter on the entity
        },
        message: {
          id: message.id,
          wamid: message.wamid,
          messageType: message.messageType,
          textBody: message.textBody,
          mediaUrl: message.mediaUrl,
          mediaCaption: message.mediaCaption,
          mediaFilename: message.mediaFilename,
          direction: message.direction,
          timestamp: message.timestamp.toISOString(), // Convert to ISO string
          status: message.status,
        },
      },
    });
  }

  /**
   * Process status update
   */
  private static async processStatusUpdate(
    statusData: any,
    webhookLogId: string
  ): Promise<void> {
    const messageRepo = AppDataSource.getRepository(Message);
    const statusUpdateRepo = AppDataSource.getRepository(MessageStatusUpdate);
    const webhookLogRepo = AppDataSource.getRepository(WebhookLog);
    const phoneNumberRepo = AppDataSource.getRepository(PhoneNumber);

    // Get WhatsApp phone_number_id from metadata (if available in status)
    // Status updates don't always have metadata, so we'll need to lookup from message
    const whatsappPhoneNumberId = statusData.metadata?.phone_number_id;
    
    let internalPhoneNumberId: string | undefined;
    
    if (whatsappPhoneNumberId) {
      const phoneNumber = await phoneNumberRepo.findOne({
        where: { phoneNumberId: whatsappPhoneNumberId }
      });
      
      if (phoneNumber) {
        internalPhoneNumberId = phoneNumber.id;
      }
    }

    // Find the message by WAMID
    console.log('[DEBUG] Looking for message with wamid:', statusData.id);
    const message = await messageRepo.findOne({
      where: { wamid: statusData.id },
    });
    
    if (!message) {
      console.error('❌ Message not found for status update:', statusData.id);
      console.error('Status data:', JSON.stringify(statusData, null, 2));
      return;
    }
    
    console.log('✅ Found message:', {
      id: message.id,
      wamid: message.wamid,
      currentStatus: message.status,
      newStatus: statusData.status,
    });

    const statusTimestamp = new Date(parseInt(statusData.timestamp) * 1000);

    // Status Hierarchy Logic: Prevent stale updates processing
    // e.g. If message is already 'delivered', ignore 'sent' updates
    const statusPriority: Record<string, number> = {
      'pending': 0,
      'sent': 1,
      'delivered': 2,
      'read': 3,
      'failed': 4
    };

    const currentPriority = statusPriority[message.status as string] || 0;
    const newPriority = statusPriority[statusData.status] || 0;

    if (newPriority <= currentPriority && message.status !== 'failed') {
      console.log(`🚫 [Webhook] Ignoring stale update ${statusData.status} for message ${message.wamid} (Current: ${message.status})`);
      return;
    }

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

    console.log(`Status updated for message ${message.wamid}: ${statusData.status}`);

    // Update webhook log with status information (use save instead of update for reliability)
    const webhookLog = await webhookLogRepo.findOne({ where: { id: webhookLogId } });
    if (webhookLog) {
      webhookLog.phoneNumberId = internalPhoneNumberId || message.phoneNumberId;
      webhookLog.messageId = message.id;
      webhookLog.contactId = message.contactId;
      webhookLog.wamid = statusData.id;
      webhookLog.statusEventType = statusData.status;
      webhookLog.statusTimestamp = statusTimestamp;

      await webhookLogRepo.save(webhookLog);

      console.log('[DEBUG] Webhook log updated for status:', {
        id: webhookLog.id,
        messageId: webhookLog.messageId,
        contactId: webhookLog.contactId,
        wamid: webhookLog.wamid,
        statusEventType: webhookLog.statusEventType,
        statusTimestamp: webhookLog.statusTimestamp,
      });
    }

    // 📢 WEBSOCKET: Broadcast status change to all clients subscribed to this phone number
    // To get phoneNumberId, we need to load the contact relation or fetch it.
    // Assuming message.contact is loaded or can be loaded.
    // For now, we'll fetch the contact if not already loaded.
    const contactRepo = AppDataSource.getRepository(Contact);
    const contact = await contactRepo.findOne({ where: { id: message.contactId } });

    if (contact?.phoneNumberId) {
      const wsPayload = {
        type: 'message:status',
        data: {
          contactId: message.contactId,
          messageId: message.id,
          wamid: message.wamid,
          status: statusData.status,
          timestamp: statusData.timestamp ? new Date(parseInt(statusData.timestamp) * 1000) : new Date(),
        },
      };
      
      console.log('📢 [WebSocket] Broadcasting status update:', JSON.stringify(wsPayload, null, 2));
      chatWebSocketManager.broadcast(contact.phoneNumberId, wsPayload);
    } else {
      console.warn(`⚠️ Cannot broadcast status update - contact not found or missing phoneNumberId for contactId: ${message.contactId}`);
    }
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

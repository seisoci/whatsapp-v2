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
import { ApiEndpoint } from '../models/ApiEndpoint';
import { WhatsAppMessagingService } from './whatsapp-messaging.service';
import { WhatsAppMediaService } from './whatsapp-media.service';
import { chatWebSocketManager } from './chat-websocket.service';
import { redisClient } from '../config/redis';
import { storageService } from './storage.service';

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
   * Generate idempotency key from payload — called by controller before enqueuing.
   */
  static generateIdempotencyKey(payload: WhatsAppWebhookPayload): string {
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
   * Process one webhook job — called by BullMQ worker (concurrency controlled there).
   * userAgent replaces full headers to keep Redis payload small.
   */
  static async doProcessWebhook(payload: WhatsAppWebhookPayload, ip: string, userAgent: string | null, idempotencyKey: string): Promise<void> {
    const startTime = Date.now();

    const webhookLogRepo = AppDataSource.getRepository(WebhookLog);

    // Deduplication via Redis SETNX — atomic, zero PostgreSQL locking.
    // ON CONFLICT was removed: that clause caused PostgreSQL speculative-insertion
    // spinlocks (100% CPU, unkillable) when called concurrently.
    // Redis SET NX EX is O(1) and never blocks other queries.
    const redisKey = `webhook:idem:${idempotencyKey}`;
    const claimed = await redisClient.set(redisKey, '1', 'NX', 'EX', 86400); // 24h TTL
    if (!claimed) {
      console.log(`[Webhook] Duplicate skipped (Redis gate): ${idempotencyKey}`);
      return;
    }

    const eventType = payload.entry[0]?.changes[0]?.field || 'unknown';
    const webhookPayload = {
      entry_count: payload.entry?.length ?? 0,
      wamid: payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id
        ?? payload.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.id
        ?? null,
    };

    // Plain INSERT — no ON CONFLICT needed (Redis already ensured uniqueness).
    const insertedRows: { id: string }[] = await AppDataSource.query(
      `INSERT INTO webhook_logs
         (id, event_type, webhook_payload, processing_status,
          request_ip, request_user_agent, idempotency_key,
          received_at, retry_count, created_at)
       VALUES
         (gen_random_uuid(), $1, $2::jsonb, 'processing', $3, $4, $5, NOW(), 0, NOW())
       RETURNING id`,
      [
        eventType,
        JSON.stringify(webhookPayload),
        ip ?? null,
        userAgent ?? null,
        idempotencyKey,
      ],
    );

    const webhookLogId = insertedRows[0].id;

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
                await this.processIncomingMessage(message, value.metadata, value.contacts || [], webhookLogId);
              }
            }

            // Process status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                await this.processStatusUpdate(status, webhookLogId);
              }
            }
          }
        }
      }

      // Mark as success
      await webhookLogRepo.update(webhookLogId, {
        processingStatus: 'success',
        processedAt: new Date(),
        processingDurationMs: Date.now() - startTime,
      });

    } catch (error: any) {
      await webhookLogRepo.update(webhookLogId, {
        processingStatus: 'failed',
        processedAt: new Date(),
        processingDurationMs: Date.now() - startTime,
        errorMessage: error.message,
        errorStack: error.stack,
      });

      // Delete Redis key so WhatsApp retry can be processed again
      await redisClient.del(redisKey);

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
            // Reuse phoneNumber already fetched above — no duplicate query
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

    // Update webhook log with message reference — raw UPDATE by PK, no SELECT needed
    await AppDataSource.query(
      `UPDATE webhook_logs
       SET phone_number_id = $1,
           message_id      = $2,
           contact_id      = $3,
           wamid           = $4,
           wa_id           = $5
       WHERE id = $6`,
      [internalPhoneNumberId, message.id, contact.id, message.wamid, contact.waId, webhookLogId],
    );

    // 📢 WEBSOCKET: Broadcast new message to all clients subscribed to this phone number
    // Calculate session remaining seconds for frontend
    const now = new Date();
    const sessionExpiresAt = contact.sessionExpiresAt;
    const sessionRemainingSeconds = sessionExpiresAt
      ? Math.max(0, Math.floor((new Date(sessionExpiresAt).getTime() - now.getTime()) / 1000))
      : 0;

    // Generate presigned URL for media so the frontend can display it immediately.
    // message.mediaUrl stores a raw S3 object key (private bucket); without presigning,
    // the browser cannot load the image until the user refreshes and the HTTP API presigns it.
    let mediaPresignedUrl = message.mediaUrl;
    if (message.mediaUrl) {
      try {
        mediaPresignedUrl = await storageService.getFileUrl(message.mediaUrl, 7 * 24 * 60 * 60);
      } catch (err) {
        console.warn('[WebSocket] Failed to presign media URL for broadcast:', err);
      }
    }

    chatWebSocketManager.broadcast(internalPhoneNumberId, {
      type: 'message:new',
      data: {
        contactId: contact.id,
        contact: {
          // Include full contact data for frontend to add new contacts to list
          id: contact.id,
          waId: contact.waId,
          phoneNumber: contact.phoneNumber,
          profileName: contact.profileName,
          profilePictureUrl: contact.profilePictureUrl,
          businessName: contact.businessName,
          isBusinessAccount: contact.isBusinessAccount,
          isBlocked: contact.isBlocked,
          notes: contact.notes,
          // Session info
          lastCustomerMessageAt: contact.lastCustomerMessageAt,
          sessionExpiresAt: contact.sessionExpiresAt,
          isSessionActive: contact.isSessionActive, // Using the getter on the entity
          sessionRemainingSeconds, // Add this for frontend timer
          // Tags (if loaded)
          tags: contact.tags || [],
          // Unread count from database (trigger keeps this updated)
          unreadCount: contact.unreadCount || 0,
        },
        message: {
          id: message.id,
          wamid: message.wamid,
          messageType: message.messageType,
          textBody: message.textBody,
          mediaUrl: mediaPresignedUrl,
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

    // 📢 WEBHOOK FORWARDING: If message sent via API (has userId), forward status to user's webhook
    if (message.userId) {
      try {
        const apiEndpointRepo = AppDataSource.getRepository(ApiEndpoint);
        const userEndpoints = await apiEndpointRepo.find({
          where: {
            createdBy: message.userId,
            isActive: true,
          }
        });

        // Filter for endpoints that have a webhookUrl
        const validEndpoints = userEndpoints.filter(ep => ep.webhookUrl);

        if (validEndpoints.length > 0) {
          console.log(`[Webhook Forwarding] Found ${validEndpoints.length} endpoints for user ${message.userId}`);

          for (const endpoint of validEndpoints) {
            const endpointPayload = {
              webhook_id: endpoint.id,
              status: statusData.status
            };

            // Fire-and-forget — 5s timeout prevents hanging promises if user endpoint is down
            const fwdController = new AbortController();
            setTimeout(() => fwdController.abort(), 5_000);
            fetch(endpoint.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(endpointPayload),
              signal: fwdController.signal,
            })
              .then(res => {
                if (!res.ok) console.warn(`[Webhook Forwarding] ${endpoint.webhookUrl} returned ${res.status}`);
              })
              .catch(err => console.error(`[Webhook Forwarding] Failed to send to ${endpoint.webhookUrl}:`, err.name === 'AbortError' ? 'timeout (5s)' : err));
          }
        }
      } catch (error) {
        console.error('[Webhook Forwarding] Error processing forwarding:', error);
      }
    }

    // 📢 WEBSOCKET: Broadcast status change to all clients subscribed to this phone number
    // To get phoneNumberId, we need to load the contact relation or fetch it.
    // Assuming message.contact is loaded or can be loaded.
    // For now, we'll fetch the contact if not already loaded.
    const contactRepo = AppDataSource.getRepository(Contact);
    const contact = await contactRepo.findOne({ where: { id: message.contactId } });

    if (contact?.phoneNumberId) {
      const wsPayload = {
        type: 'message:status' as const,
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

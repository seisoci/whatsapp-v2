/**
 * WhatsApp Webhook Handler Service
 * Processes incoming webhooks from WhatsApp Cloud API
 */

import crypto from 'crypto';
import { AppDataSource } from '../config/database';
import { Contact } from '../models/Contact';
import { Message } from '../models/Message';
import { MessageStatusUpdate } from '../models/MessageStatusUpdate';
import { PhoneNumber } from '../models/PhoneNumber';
import { MessageQueue } from '../models/MessageQueue';
import { WhatsAppMessagingService } from './whatsapp-messaging.service';
import { WhatsAppMediaService } from './whatsapp-media.service';
import { chatWebSocketManager } from './chat-websocket.service';
import { redisClient } from '../config/redis';
import { storageService } from './storage.service';
import { webhookForwardingQueue } from '../config/queue';
import { indexContact, indexMessage } from './meilisearch.service';

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
   * Returns true if the webhook contains ONLY status updates (delivered/read/sent/failed).
   * These are processed inline (not queued) to avoid clogging the BullMQ worker.
   */
  static isStatusOnlyWebhook(payload: WhatsAppWebhookPayload): boolean {
    const changes = payload.entry[0]?.changes ?? [];
    return changes.every((change) => {
      const value = change.value;
      return value?.statuses && value.statuses.length > 0 && !value.messages?.length;
    });
  }

  /**
   * Process one webhook job — called by BullMQ worker (concurrency controlled there).
   * userAgent replaces full headers to keep Redis payload small.
   */
  static async doProcessWebhook(payload: WhatsAppWebhookPayload, ip: string, userAgent: string | null, idempotencyKey: string, attemptsMade = 0): Promise<void> {
    const startTime = Date.now();

    // Deduplication via Redis SETNX — atomic, zero PostgreSQL locking.
    // ON CONFLICT was removed: that clause caused PostgreSQL speculative-insertion
    // spinlocks (100% CPU, unkillable) when called concurrently.
    // Redis SET NX EX is O(1) and never blocks other queries.
    const redisKey = `webhook:idem:${idempotencyKey}`;

    // On retry: the previous attempt may have claimed the key but was killed
    // mid-processing (e.g. process restart during putObject). Clear the stale
    // key so this retry is not silently skipped.
    if (attemptsMade > 0) {
      await redisClient.del(redisKey);
      console.log(`[Webhook] Cleared stale idem key for retry (attempt ${attemptsMade}): ${idempotencyKey}`);
    }

    const claimed = await redisClient.set(redisKey, '1', 'EX', 86400, 'NX'); // 24h TTL
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

      // Mark as success — raw UPDATE, no ORM overhead
      await AppDataSource.query(
        `UPDATE webhook_logs
         SET processing_status      = 'success',
             processed_at           = NOW(),
             processing_duration_ms = $1
         WHERE id = $2`,
        [Date.now() - startTime, webhookLogId],
      );

    } catch (error: any) {
      await AppDataSource.query(
        `UPDATE webhook_logs
         SET processing_status      = 'failed',
             processed_at           = NOW(),
             processing_duration_ms = $1,
             error_message          = $2,
             error_stack            = $3
         WHERE id = $4`,
        [Date.now() - startTime, error.message, error.stack, webhookLogId],
      );

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
        profileName: profileName || null,
        profilePictureUrl: s3ProfilePictureUrl, // Use S3 URL, not temp WhatsApp URL
      });
      await contactRepo.save(contact);
    } else {
      // Update profile name and picture if we have new info
      let updated = false;

      // Only update profileName if current name is missing or is just the phone number.
      // Once a contact has a real name set, don't overwrite it from WhatsApp profile.
      const currentNameIsMissing = !contact.profileName || contact.profileName === contact.waId || contact.profileName === contact.phoneNumber;
      if (profileName && currentNameIsMissing) {
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

    // 🔍 MEILISEARCH: Sync contact + message (fire-and-forget — never block webhook processing)
    Promise.all([
      indexContact({
        id: contact.id,
        waId: contact.waId,
        phoneNumber: contact.phoneNumber,
        profileName: contact.profileName,
        businessName: contact.businessName,
        phoneNumberId: contact.phoneNumberId,
        isArchived: contact.isArchived,
        unreadCount: contact.unreadCount || 0,
        lastMessageAt: messageTimestamp.getTime(),
        createdAt: contact.createdAt.getTime(),
      }),
      indexMessage({
        id: message.id,
        contactId: contact.id,
        phoneNumberId: internalPhoneNumberId,
        contactName: contact.profileName,
        contactPhone: contact.phoneNumber,
        direction: message.direction,
        messageType: message.messageType,
        textBody: message.textBody,
        mediaCaption: message.mediaCaption,
        timestamp: messageTimestamp.getTime(),
      }),
    ]).catch((err) => console.warn('[Meilisearch] Sync error (non-fatal):', err));

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
          contactsPayload: message.contactsPayload || null,
          locationLatitude: message.locationLatitude || null,
          locationLongitude: message.locationLongitude || null,
          locationName: message.locationName || null,
          locationAddress: message.locationAddress || null,
          direction: message.direction,
          timestamp: message.timestamp.toISOString(),
          status: message.status,
          contextMessageId: message.contextMessageId || null,
          contextFrom: message.contextFrom || null,
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
      console.warn(`[Webhook] Status update skipped — message not found (wamid: ${statusData.id})`);
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

    // Raw UPDATE — no SELECT before write, no ORM overhead, no lock contention
    await AppDataSource.query(
      `UPDATE webhook_logs
       SET phone_number_id    = $1,
           message_id         = $2,
           contact_id         = $3,
           wamid              = $4,
           status_event_type  = $5,
           status_timestamp   = $6
       WHERE id = $7`,
      [
        internalPhoneNumberId || message.phoneNumberId,
        message.id,
        message.contactId,
        statusData.id,
        statusData.status,
        statusTimestamp,
        webhookLogId,
      ],
    );

    // 📢 WEBHOOK FORWARDING: Forward status to API endpoint's webhook URL
    // Uses BullMQ queue with retry instead of fire-and-forget to ensure delivery.
    try {
      const mqRepo = AppDataSource.getRepository(MessageQueue);
      const mqRecord = await mqRepo.findOne({
        where: { messageId: message.id },
        relations: ['apiEndpoint'],
      });

      const endpoint = mqRecord?.apiEndpoint;

      if (endpoint?.webhookUrl && endpoint.isActive) {
        const endpointPayload = {
          webhook_id: endpoint.id,
          queue_id: mqRecord!.id,
          status: statusData.status,
        };

        console.log(`[Webhook Forwarding] Queuing ${statusData.status} for queue ${mqRecord!.id} to ${endpoint.webhookUrl}`);

        // Enqueue with retry — jobId is idempotent per (queue_id + status)
        await webhookForwardingQueue.add(
          'forward',
          {
            webhookUrl: endpoint.webhookUrl,
            apiKey: endpoint.apiKey || null,
            payload: endpointPayload,
          },
          {
            jobId: `fwd-${mqRecord!.id}-${statusData.status}`,
          }
        );
      }
    } catch (error) {
      console.error('[Webhook Forwarding] Error queuing forwarding job:', error);
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
  static verifyWebhookSignature(rawBody: string, signature: string, appSecret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`),
    );
  }
}

/**
 * Message Controller
 * Handles message operations for chat interface
 */

import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { Message } from '../models/Message';
import { Contact } from '../models/Contact';
import { PhoneNumber } from '../models/PhoneNumber';
import { WhatsAppMessagingService } from '../services/whatsapp-messaging.service';
import { chatWebSocketManager } from '../services/chat-websocket.service';
import {
  getMessagesSchema,
  sendMessageSchema,
} from '../validators/chat.validator';
import { withPermissions } from '../utils/controller.decorator';
import { templateCacheService } from '../services/template-cache.service';
import { cacheService } from '../services/cache.service';
import { storageService } from '../services/storage.service';

export class MessageController {
  /**
   * Permission definitions
   */
  static permissions = {
    getMessages: 'chat-index',
    sendMessage: 'chat-store',
    markAsRead: 'chat-update',
  };

  /**
   * GET /api/v1/chat/messages
   * Get message history for a contact
   */
  static async getMessages(c: Context) {
    try {
      const query = c.req.query();
      const validation = getMessagesSchema.safeParse(query);

      if (!validation.success) {
        return c.json(
          {
            success: false,
            message: 'Invalid query parameters',
            errors: validation.error.errors,
          },
          400
        );
      }

      const { contactId, page, limit } = validation.data;
      const offset = (page - 1) * limit;

      const messageRepo = AppDataSource.getRepository(Message);

      // Get total count
      const total = await messageRepo
        .createQueryBuilder('message')
        .where('message.contact_id = :contactId', { contactId })
        .getCount();

      // Get messages with pagination (newest first)
      const messages = await messageRepo
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.user', 'user')
        .where('message.contact_id = :contactId', { contactId })
        .orderBy('message.timestamp', 'DESC')
        .skip(offset)
        .take(limit)
        .getMany();

      // Render template bodies for template messages that don't have textBody
      const processedMessages = await Promise.all(
        messages.map(async (msg) => {
          if (
            msg.messageType === 'template' &&
            !msg.textBody &&
            msg.templateName &&
            msg.templateLanguage
          ) {
            try {
              const templateDef =
                await templateCacheService.getTemplateByPhoneNumber(
                  msg.phoneNumberId,
                  msg.templateName,
                  msg.templateLanguage
                );

              if (templateDef) {
                const rendered = templateCacheService.renderTemplateBody(
                  templateDef,
                  msg.templateComponents || []
                );
                // Combine header, body, and footer into a single text
                const parts: string[] = [];
                if (rendered.header) parts.push(rendered.header);
                if (rendered.body) parts.push(rendered.body);
                if (rendered.footer) parts.push(rendered.footer);
                msg.textBody = parts.join('\n\n');
              } else {
                // Template definition not available — extract parameter values as fallback
                const components: any[] = msg.templateComponents || [];
                const bodyComp = components.find(
                  (c) => c.type?.toUpperCase() === 'BODY'
                );
                const params: any[] = bodyComp?.parameters || [];
                if (params.length > 0) {
                  msg.textBody = `[${msg.templateName}] ` + params
                    .map((p: any) => p.text)
                    .filter(Boolean)
                    .join(', ');
                }
              }
            } catch (error) {
              console.error(
                `[MessageController] Failed to render template for message ${msg.id}:`,
                error
              );
            }
          }
          return msg;
        })
      );

      // Presign media URLs (with Redis cache, TTL = 7 days)
      // mediaUrl stores an S3 object key (e.g. 628xxx/image/1704000000000-photo.jpg)
      const PRESIGN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
      const finalMessages = await Promise.all(
        processedMessages.map(async (msg) => {
          if (!msg.mediaUrl) return msg;

          const cacheKey = `presign:${msg.mediaUrl}`;
          let presignedUrl = await cacheService.get<string>(cacheKey, false);

          if (!presignedUrl) {
            try {
              // mediaUrl is now an object key — pass directly to storage service
              // For legacy full URLs, extract the key first
              let objectKey = msg.mediaUrl;
              try {
                const parsed = new URL(msg.mediaUrl);
                // It's a full URL (legacy) — extract object key
                const bucket = process.env.MINIO_BUCKET || 'whatsapp';
                const parts = parsed.pathname.split('/');
                const bucketIdx = parts.indexOf(bucket);
                objectKey =
                  bucketIdx !== -1
                    ? parts.slice(bucketIdx + 1).join('/')
                    : parsed.pathname.replace(/^\//, '');
              } catch {
                // Not a URL — already a plain object key, use as-is
              }

              presignedUrl = await storageService.getFileUrl(
                objectKey,
                PRESIGN_TTL
              );
              await cacheService.set(cacheKey, presignedUrl, PRESIGN_TTL);
            } catch (err) {
              console.warn(
                `[MessageController] Failed to presign URL for message ${msg.id}:`,
                err
              );
              presignedUrl = msg.mediaUrl; // fallback to stored value
            }
          }

          return { ...msg, mediaUrl: presignedUrl };
        })
      );
      return c.json({
        success: true,
        data: finalMessages.reverse(), // Reverse to show oldest first in UI
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error getting messages:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to get messages',
          error: error.message,
        },
        500
      );
    }
  }

  /**
   * POST /api/v1/chat/messages
   * Send a message
   */
  static async sendMessage(c: Context) {
    try {
      const body = await c.req.json();
      const validation = sendMessageSchema.safeParse(body);

      if (!validation.success) {
        return c.json(
          {
            success: false,
            message: 'Invalid request body',
            errors: validation.error.errors,
          },
          400
        );
      }

      const { contactId, phoneNumberId, type, text, template, media, contacts } =
        validation.data;

      // Get authenticated user ID from context
      // If wrapped with permissions, user is User entity (has .id)
      const user = c.get('user');
      const userId = user?.id; // as requested by user

      // Get contact
      const contactRepo = AppDataSource.getRepository(Contact);
      const contact = await contactRepo.findOne({ where: { id: contactId } });

      if (!contact) {
        return c.json(
          {
            success: false,
            message: 'Contact not found',
          },
          404
        );
      }

      // Get phone number credentials
      // The frontend may pass either the DB uuid (id) or the WA phone_number_id
      // Only select columns that exist in DB (cached columns like displayPhoneNumber may not be migrated yet)
      const phoneNumberSelect = {
        id: true,
        phoneNumberId: true,
        accessToken: true,
        wabaId: true,
        name: true,
        isActive: true,
      } as const;

      const phoneNumberRepo = AppDataSource.getRepository(PhoneNumber);
      let phoneNumber = await phoneNumberRepo
        .findOne({ where: { id: phoneNumberId }, select: phoneNumberSelect })
        .catch(() => null);
      if (!phoneNumber) {
        phoneNumber = await phoneNumberRepo.findOne({
          where: { phoneNumberId },
          select: phoneNumberSelect,
        });
      }

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number not found',
          },
          404
        );
      }

      let result: any;

      // Send message based on type
      switch (type) {
        case 'text':
          if (!text) {
            return c.json(
              {
                success: false,
                message: 'Text content is required for text messages',
              },
              400
            );
          }

          result = await WhatsAppMessagingService.sendTextMessage({
            phoneNumberId: phoneNumber.phoneNumberId,
            internalPhoneNumberId: phoneNumber.id,
            accessToken: phoneNumber.accessToken,
            to: contact.waId,
            text: text.body,
            contactId: contact.id,
            userId: userId, // Add userId
          });
          break;

        case 'template':
          if (!template) {
            return c.json(
              {
                success: false,
                message: 'Template content is required for template messages',
              },
              400
            );
          }

          result = await WhatsAppMessagingService.sendTemplateMessage({
            phoneNumberId: phoneNumber.phoneNumberId,
            internalPhoneNumberId: phoneNumber.id,
            accessToken: phoneNumber.accessToken,
            to: contact.waId,
            templateName: template.name,
            templateLanguage: template.language,
            components: template.components,
            contactId: contact.id,
            userId: userId,
          });
          break;

        case 'image':
        case 'video':
        case 'document':
        case 'audio':
          if (!media) {
            return c.json(
              {
                success: false,
                message: 'Media content is required for media messages',
              },
              400
            );
          }

          result = await WhatsAppMessagingService.sendMediaMessage({
            phoneNumberId: phoneNumber.phoneNumberId,
            internalPhoneNumberId: phoneNumber.id,
            accessToken: phoneNumber.accessToken,
            to: contact.waId,
            mediaType: type,
            mediaId: media.mediaId,
            mediaUrl: media.mediaUrl,
            caption: media.caption,
            filename: media.filename,
            contactId: contact.id,
            userId: userId, // Add userId
          });
          break;

        case 'contacts':
          if (!contacts || contacts.length === 0) {
            return c.json(
              {
                success: false,
                message: 'Contacts data is required for contacts messages',
              },
              400
            );
          }

          result = await WhatsAppMessagingService.sendContactMessage({
            phoneNumberId: phoneNumber.phoneNumberId,
            internalPhoneNumberId: phoneNumber.id,
            accessToken: phoneNumber.accessToken,
            to: contact.waId,
            contacts,
            contactId: contact.id,
            userId,
          });
          break;

        default:
          return c.json(
            {
              success: false,
              message: 'Unsupported message type',
            },
            400
          );
      }

      // 📢 WEBSOCKET: Broadcast outgoing message to all clients subscribed to this phone number
      if (result.savedMessage) {
        const savedMessage = result.savedMessage;

        chatWebSocketManager.broadcast(phoneNumber.id, {
          type: 'message:new',
          data: {
            contactId: contact.id,
            message: {
              id: savedMessage.id,
              wamid: savedMessage.wamid,
              messageType: savedMessage.messageType,
              textBody: savedMessage.textBody,
              mediaUrl: savedMessage.mediaUrl,
              mediaCaption: savedMessage.mediaCaption,
              mediaFilename: savedMessage.mediaFilename,
              mediaMimeType: savedMessage.mediaMimeType,
              contactsPayload: savedMessage.contactsPayload || null,
              direction: savedMessage.direction,
              timestamp:
                savedMessage.timestamp instanceof Date
                  ? savedMessage.timestamp.toISOString()
                  : savedMessage.timestamp,
              status: savedMessage.status,
              readAt:
                savedMessage.readAt instanceof Date
                  ? savedMessage.readAt.toISOString()
                  : savedMessage.readAt,
              userId: savedMessage.userId,
              user: savedMessage.user,
              contextMessageId: savedMessage.contextMessageId || null,
              contextFrom: savedMessage.contextFrom || null,
            },
          },
        });
      }

      return c.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          whatsapp: result,
          message: result.savedMessage, // Include saved message with user info
        },
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to send message',
          error: error.message,
        },
        500
      );
    }
  }

  /**
   * PUT /api/v1/chat/messages/:id/read
   * Mark a message as read
   */
  static async markAsRead(c: Context) {
    try {
      const messageId = c.req.param('id');
      const messageRepo = AppDataSource.getRepository(Message);

      const message = await messageRepo.findOne({ where: { id: messageId } });

      if (!message) {
        return c.json(
          {
            success: false,
            message: 'Message not found',
          },
          404
        );
      }

      if (message.direction !== 'incoming') {
        return c.json(
          {
            success: false,
            message: 'Can only mark incoming messages as read',
          },
          400
        );
      }

      message.readAt = new Date();
      await messageRepo.save(message);

      return c.json({
        success: true,
        message: 'Message marked as read',
        data: message,
      });
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to mark message as read',
          error: error.message,
        },
        500
      );
    }
  }
}

export const MessageControllerWithPermissions = withPermissions(
  MessageController,
  MessageController.permissions
);

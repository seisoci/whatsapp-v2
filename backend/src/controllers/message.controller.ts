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
import { getMessagesSchema, sendMessageSchema } from '../validators/chat.validator';
import { withPermissions } from '../utils/controller.decorator';
import { nowJakarta } from '../utils/timezone';

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
        return c.json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        }, 400);
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

      return c.json({
        success: true,
        data: messages.reverse(), // Reverse to show oldest first in UI
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error getting messages:', error);
      return c.json({
        success: false,
        message: 'Failed to get messages',
        error: error.message,
      }, 500);
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
        return c.json({
          success: false,
          message: 'Invalid request body',
          errors: validation.error.errors,
        }, 400);
      }

      const { contactId, phoneNumberId, type, text, template, media } = validation.data;

      // Get authenticated user ID from context (set by auth middleware)
      const user = c.get('user');
      const userId = user?.userId;

      // Get contact
      const contactRepo = AppDataSource.getRepository(Contact);
      const contact = await contactRepo.findOne({ where: { id: contactId } });

      if (!contact) {
        return c.json({
          success: false,
          message: 'Contact not found',
        }, 404);
      }

      // Get phone number credentials
      const phoneNumberRepo = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepo.findOne({ where: { id: phoneNumberId } });

      if (!phoneNumber) {
        return c.json({
          success: false,
          message: 'Phone number not found',
        }, 404);
      }

      let result: any;

      // Send message based on type
      switch (type) {
        case 'text':
          if (!text) {
            return c.json({
              success: false,
              message: 'Text content is required for text messages',
            }, 400);
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
            return c.json({
              success: false,
              message: 'Template content is required for template messages',
            }, 400);
          }

          result = await WhatsAppMessagingService.sendTemplateMessage({
            phoneNumberId: phoneNumber.phoneNumberId,
            accessToken: phoneNumber.accessToken,
            to: contact.waId,
            templateName: template.name,
            templateLanguage: template.language,
            components: template.components,
            contactId: contact.id,
          });
          break;

        case 'image':
        case 'video':
        case 'document':
        case 'audio':
          if (!media) {
            return c.json({
              success: false,
              message: 'Media content is required for media messages',
            }, 400);
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

        default:
          return c.json({
            success: false,
            message: 'Unsupported message type',
          }, 400);
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
              direction: savedMessage.direction,
              timestamp: savedMessage.timestamp instanceof Date ? savedMessage.timestamp.toISOString() : savedMessage.timestamp,
              status: savedMessage.status,
              userId: savedMessage.userId,
              user: savedMessage.user,
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
      return c.json({
        success: false,
        message: 'Failed to send message',
        error: error.message,
      }, 500);
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
        return c.json({
          success: false,
          message: 'Message not found',
        }, 404);
      }

      if (message.direction !== 'incoming') {
        return c.json({
          success: false,
          message: 'Can only mark incoming messages as read',
        }, 400);
      }

      message.readAt = nowJakarta();
      await messageRepo.save(message);

      return c.json({
        success: true,
        message: 'Message marked as read',
        data: message,
      });
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      return c.json({
        success: false,
        message: 'Failed to mark message as read',
        error: error.message,
      }, 500);
    }
  }
}

export const MessageControllerWithPermissions = withPermissions(
  MessageController,
  MessageController.permissions
);


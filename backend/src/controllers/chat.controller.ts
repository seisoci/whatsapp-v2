/**
 * Chat Controller
 * Handles contact listing and management for chat interface
 */

import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { Contact } from '../models/Contact';
import { Message } from '../models/Message';
import { PhoneNumber } from '../models/PhoneNumber';
import { WhatsAppService } from '../services/whatsapp.service';
import { getContactsSchema, markAsReadSchema } from '../validators/chat.validator';
import { withPermissions } from '../utils/controller.decorator';
import { nowJakarta } from '../utils/timezone';

export class ChatController {
  /**
   * Permission definitions
   */
  static permissions = {
    getContacts: 'chat-index',
    getPhoneNumbers: 'chat-index',
    getContact: 'chat-index',
    markConversationAsRead: 'chat-update',
    deleteContact: 'chat-destroy',
  };

  /**
   * GET /api/v1/chat/phone-numbers
   * Get all phone numbers (accessible with chat-index)
   */
  static async getPhoneNumbers(c: Context) {
    try {
      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);

      const phoneNumbers = await phoneNumberRepository.find({
        relations: ['creator'],
        select: {
          id: true,
          phoneNumberId: true,
          accessToken: true,
          wabaId: true,
          name: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            id: true,
            username: true,
            email: true,
          },
        },
        order: {
          createdAt: 'DESC',
        },
      });

      // Fetch real-time data from WhatsApp API
      const enrichedPhoneNumbers = await Promise.all(
        phoneNumbers.map(async (phone) => {
          try {
            const phoneInfo = await WhatsAppService.getPhoneNumberInfo(
              phone.phoneNumberId,
              phone.accessToken
            );

            return {
              id: phone.id,
              phoneNumberId: phone.phoneNumberId,
              wabaId: phone.wabaId,
              name: phone.name,
              isActive: phone.isActive,
              // Real-time data from WhatsApp API
              displayPhoneNumber: phoneInfo.display_phone_number,
              verifiedName: phoneInfo.verified_name,
              qualityRating: phoneInfo.quality_rating,
              messagingLimitTier: phoneInfo.messaging_limit_tier,
              isOfficialBusinessAccount: phoneInfo.is_official_business_account,
              createdAt: phone.createdAt,
              updatedAt: phone.updatedAt,
              creator: phone.creator,
            };
          } catch (error) {
            // Return minimal data on failure
            return {
              id: phone.id,
              phoneNumberId: phone.phoneNumberId,
              wabaId: phone.wabaId,
              name: phone.name,
              isActive: phone.isActive,
              displayPhoneNumber: 'Error fetching data',
              verifiedName: null,
              qualityRating: 'UNKNOWN',
              messagingLimitTier: 'UNKNOWN',
              isOfficialBusinessAccount: false,
              createdAt: phone.createdAt,
              updatedAt: phone.updatedAt,
              creator: phone.creator,
              error: 'Failed to fetch WhatsApp data',
            };
          }
        })
      );

      return c.json(
        {
          success: true,
          data: enrichedPhoneNumbers,
        },
        200
      );
    } catch (error: any) {
      console.error('Get phone numbers error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * GET /api/v1/chat/contacts
   * Get all contacts for a phone number with last message and unread count
   */
  static async getContacts(c: Context) {
    try {
      const query = c.req.query();
      const validation = getContactsSchema.safeParse(query);

      if (!validation.success) {
        return c.json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        }, 400);
      }

      const { phoneNumberId, search, filter, page, limit } = validation.data;
      const offset = (page - 1) * limit;

      // OPTIMIZED: Using denormalized unread_count column (auto-updated via PostgreSQL trigger)
      // This eliminates the expensive correlated subquery for unread counts
      // Note: Using snake_case column names for raw SQL (database format)
      let baseQuery = `
        SELECT 
          c.*,
          (SELECT row_to_json(last_msg) FROM (
            SELECT id, message_type, text_body, media_caption, direction, timestamp, status
            FROM messages
            WHERE contact_id = c.id
            ORDER BY timestamp DESC
            LIMIT 1
          ) last_msg) as last_message_data
        FROM contacts c
        WHERE c.phone_number_id = $1
      `;

      const params: any[] = [phoneNumberId];
      let paramIndex = 2;

      // Search filter
      if (search) {
        baseQuery += ` AND (c.profile_name ILIKE $${paramIndex} OR c.phone_number ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Apply unread filter directly on denormalized column (uses partial index)
      if (filter === 'unread') {
        baseQuery += ` AND c.unread_count > 0`;
      }

      // Get total count (with or without unread filter)
      const countQuery = `SELECT COUNT(*) as total FROM contacts c WHERE c.phone_number_id = $1${search ? ` AND (c.profile_name ILIKE $2 OR c.phone_number ILIKE $2)` : ''}${filter === 'unread' ? ' AND c.unread_count > 0' : ''}`;
      const countResult = await AppDataSource.query(countQuery, search ? [phoneNumberId, `%${search}%`] : [phoneNumberId]);
      const total = parseInt(countResult[0].total);

      // Add ordering and pagination
      baseQuery += ` ORDER BY c.last_message_at DESC NULLS LAST`;
      baseQuery += ` LIMIT ${limit} OFFSET ${offset}`;

      // Execute the optimized query
      const rawContacts = await AppDataSource.query(baseQuery, params);

      // Fetch tags for each contact (still need this join)
      const contactIds = rawContacts.map((c: any) => c.id);
      let tagsMap: Record<string, any[]> = {};

      if (contactIds.length > 0) {
        const tagsQuery = `
          SELECT ct.contact_id, t.* 
          FROM contact_tags ct
          JOIN tags t ON ct.tag_id = t.id
          WHERE ct.contact_id = ANY($1)
        `;
        const tagsResult = await AppDataSource.query(tagsQuery, [contactIds]);

        tagsResult.forEach((row: any) => {
          if (!tagsMap[row.contact_id]) {
            tagsMap[row.contact_id] = [];
          }
          tagsMap[row.contact_id].push({
            id: row.id,
            name: row.name,
            color: row.color,
          });
        });
      }

      // Format response - Note: raw SQL returns snake_case column names
      const now = new Date();
      const enrichedContacts = rawContacts.map((contact: any) => {
        const sessionExpiresAt = contact.session_expires_at;
        const isSessionActive = sessionExpiresAt ? now < new Date(sessionExpiresAt) : false;
        const sessionRemainingSeconds = sessionExpiresAt
          ? Math.max(0, Math.floor((new Date(sessionExpiresAt).getTime() - now.getTime()) / 1000))
          : 0;

        const lastMessageData = contact.last_message_data;

        return {
          id: contact.id,
          waId: contact.wa_id,
          phoneNumber: contact.phone_number,
          profileName: contact.profile_name,
          profilePictureUrl: contact.profile_picture_url,
          businessName: contact.business_name,
          isBusinessAccount: contact.is_business_account,
          isBlocked: contact.is_blocked,
          tags: tagsMap[contact.id] || [],
          notes: contact.notes,

          // Session info (calculated)
          sessionExpiresAt: contact.session_expires_at,
          isSessionActive,
          sessionRemainingSeconds,

          // Last message preview (from subquery) - also snake_case
          lastMessage: lastMessageData ? {
            id: lastMessageData.id,
            messageType: lastMessageData.message_type,
            textBody: lastMessageData.text_body,
            mediaCaption: lastMessageData.media_caption,
            direction: lastMessageData.direction,
            timestamp: lastMessageData.timestamp,
            status: lastMessageData.status,
          } : null,

          // Unread count (from subquery)
          unreadCount: parseInt(contact.unread_count) || 0,

          // Timestamps
          createdAt: contact.created_at,
          updatedAt: contact.updated_at,
        };
      });

      return c.json({
        success: true,
        data: enrichedContacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error getting contacts:', error);
      return c.json({
        success: false,
        message: 'Failed to get contacts',
        error: error.message,
      }, 500);
    }
  }

  /**
   * GET /api/v1/chat/contacts/:id
   * Get single contact details
   */
  static async getContact(c: Context) {
    try {
      const contactId = c.req.param('id');
      const contactRepo = AppDataSource.getRepository(Contact);

      const contact = await contactRepo.findOne({
        where: { id: contactId },
        relations: ['tags'],
      });

      if (!contact) {
        return c.json({
          success: false,
          message: 'Contact not found',
        }, 404);
      }

      // Calculate session info
      const now = new Date();
      const sessionExpiresAt = contact.sessionExpiresAt;
      const isSessionActive = sessionExpiresAt ? now < new Date(sessionExpiresAt) : false;
      const sessionRemainingSeconds = sessionExpiresAt
        ? Math.max(0, Math.floor((new Date(sessionExpiresAt).getTime() - now.getTime()) / 1000))
        : 0;

      return c.json({
        success: true,
        data: {
          id: contact.id,
          waId: contact.waId,
          phoneNumber: contact.phoneNumber,
          profileName: contact.profileName,
          businessName: contact.businessName,
          isBusinessAccount: contact.isBusinessAccount,
          isBlocked: contact.isBlocked,
          tags: contact.tags,
          customFields: contact.customFields,
          notes: contact.notes,
          sessionExpiresAt: contact.sessionExpiresAt,
          isSessionActive,
          sessionRemainingSeconds,
          firstMessageAt: contact.firstMessageAt,
          lastMessageAt: contact.lastMessageAt,
          lastCustomerMessageAt: contact.lastCustomerMessageAt,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error getting contact:', error);
      return c.json({
        success: false,
        message: 'Failed to get contact',
        error: error.message,
      }, 500);
    }
  }

  /**
   * PUT /api/v1/chat/contacts/:id/read
   * Mark all messages in conversation as read
   */
  static async markConversationAsRead(c: Context) {
    try {
      const contactId = c.req.param('id');
      const messageRepo = AppDataSource.getRepository(Message);
      const contactRepo = AppDataSource.getRepository(Contact);

      // Get contact to find phoneNumberId for WebSocket broadcast
      const contact = await contactRepo.findOne({
        where: { id: contactId }
      });

      if (!contact) {
        return c.json({
          success: false,
          message: 'Contact not found',
        }, 404);
      }

      // Update all unread incoming messages
      const updateResult = await messageRepo
        .createQueryBuilder()
        .update(Message)
        .set({ readAt: nowJakarta() })
        .where('contact_id = :contactId', { contactId })
        .andWhere('direction = :direction', { direction: 'incoming' })
        .andWhere('read_at IS NULL')
        .execute();

      // If any messages were marked as read, broadcast to all users
      if (updateResult.affected && updateResult.affected > 0) {
        // Import WebSocket manager dynamically to avoid circular dependency
        const { chatWebSocketManager } = await import('../services/chat-websocket.service');

        // Broadcast contact:updated event so other users see unread count = 0
        chatWebSocketManager.broadcast(contact.phoneNumberId, {
          type: 'contact:updated',
          data: {
            contactId: contact.id,
            contact: {
              id: contact.id,
              unreadCount: 0, // After marking as read, unread count is 0
            },
          },
        });
      }

      return c.json({
        success: true,
        message: 'Conversation marked as read',
      });
    } catch (error: any) {
      console.error('Error marking conversation as read:', error);
      return c.json({
        success: false,
        message: 'Failed to mark as read',
        error: error.message,
      }, 500);
    }
  }

  /**
   * DELETE /api/v1/chat/contacts/:id
   * Delete contact and all messages
   */
  static async deleteContact(c: Context) {
    try {
      const contactId = c.req.param('id');
      const contactRepo = AppDataSource.getRepository(Contact);

      const result = await contactRepo.delete(contactId);

      if (result.affected === 0) {
        return c.json({
          success: false,
          message: 'Contact not found',
        }, 404);
      }

      return c.json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      return c.json({
        success: false,
        message: 'Failed to delete contact',
        error: error.message,
      }, 500);
    }
  }
}

export const ChatControllerWithPermissions = withPermissions(
  ChatController,
  ChatController.permissions
);


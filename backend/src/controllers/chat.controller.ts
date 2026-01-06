/**
 * Chat Controller
 * Handles contact listing and management for chat interface
 */

import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { Contact } from '../models/Contact';
import { Message } from '../models/Message';
import { getContactsSchema, markAsReadSchema } from '../validators/chat.validator';

export class ChatController {
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

      const { phoneNumberId, search, page, limit } = validation.data;
      const offset = (page - 1) * limit;

      const contactRepo = AppDataSource.getRepository(Contact);
      const messageRepo = AppDataSource.getRepository(Message);

      // Build query
      let queryBuilder = contactRepo
        .createQueryBuilder('contact')
        .leftJoinAndSelect('contact.tags', 'tag')
        .where('contact.phoneNumberId = :phoneNumberId', { phoneNumberId })
        .orderBy('contact.lastMessageAt', 'DESC', 'NULLS LAST');

      // Search filter
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          '(contact.profileName ILIKE :search OR contact.phoneNumber ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Get contacts with pagination
      const contacts = await queryBuilder
        .skip(offset)
        .take(limit)
        .getMany();

      // Enrich with last message and unread count
      const enrichedContacts = await Promise.all(
        contacts.map(async (contact) => {
          // Get last message
          const lastMessage = await messageRepo
            .createQueryBuilder('message')
            .where('message.contactId = :contactId', { contactId: contact.id })
            .orderBy('message.timestamp', 'DESC')
            .limit(1)
            .getOne();

          // Get unread count
          const unreadCount = await messageRepo
            .createQueryBuilder('message')
            .where('message.contactId = :contactId', { contactId: contact.id })
            .andWhere('message.direction = :direction', { direction: 'incoming' })
            .andWhere('message.readAt IS NULL')
            .getCount();

          // Calculate session info
          const now = new Date();
          const sessionExpiresAt = contact.sessionExpiresAt;
          const isSessionActive = sessionExpiresAt ? now < new Date(sessionExpiresAt) : false;
          const sessionRemainingSeconds = sessionExpiresAt 
            ? Math.max(0, Math.floor((new Date(sessionExpiresAt).getTime() - now.getTime()) / 1000))
            : 0;

          return {
            id: contact.id,
            waId: contact.waId,
            phoneNumber: contact.phoneNumber,
            profileName: contact.profileName,
            businessName: contact.businessName,
            isBusinessAccount: contact.isBusinessAccount,
            isBlocked: contact.isBlocked,
            tags: contact.tags,
            notes: contact.notes,
            
            // Session info (calculated)
            sessionExpiresAt: contact.sessionExpiresAt,
            isSessionActive,
            sessionRemainingSeconds,
            
            // Last message preview
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              messageType: lastMessage.messageType,
              textBody: lastMessage.textBody,
              mediaCaption: lastMessage.mediaCaption,
              direction: lastMessage.direction,
              timestamp: lastMessage.timestamp,
              status: lastMessage.status,
            } : null,
            
            // Unread count
            unreadCount,
            
            // Timestamps
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
          };
        })
      );

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

      // Update all unread incoming messages
      await messageRepo
        .createQueryBuilder()
        .update(Message)
        .set({ readAt: new Date() })
        .where('contact_id = :contactId', { contactId })
        .andWhere('direction = :direction', { direction: 'incoming' })
        .andWhere('read_at IS NULL')
        .execute();

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

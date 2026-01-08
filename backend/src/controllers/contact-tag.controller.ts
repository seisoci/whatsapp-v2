/**
 * Contact Tag Controller
 * Handles associating tags with contacts
 */

import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { Contact } from '../models/Contact';
import { Tag } from '../models/Tag';

export class ContactTagController {
  /**
   * POST /api/v1/chat/contacts/:contactId/tags
   * Add tag to contact
   */
  static async addTag(c: Context) {
    try {
      const contactId = c.req.param('contactId');
      const body = await c.req.json();
      const { tagId } = body;

      if (!tagId) {
        return c.json({ success: false, message: 'Tag ID is required' }, 400);
      }

      const contactRepo = AppDataSource.getRepository(Contact);
      const tagRepo = AppDataSource.getRepository(Tag);

      // Load contact with existing tags
      const contact = await contactRepo.findOne({
        where: { id: contactId },
        relations: ['tags'],
      });

      if (!contact) {
        return c.json({ success: false, message: 'Contact not found' }, 404);
      }

      const tag = await tagRepo.findOne({ where: { id: tagId } });
      if (!tag) {
        return c.json({ success: false, message: 'Tag not found' }, 404);
      }

      // Check if already tagged
      if (contact.tags.some(t => t.id === tagId)) {
        return c.json({ success: true, message: 'Tag already added', data: contact });
      }

      // Add tag
      contact.tags.push(tag);
      await contactRepo.save(contact);


      // Re-fetch to ensure fresh state
      const updatedContact = await contactRepo.findOne({
        where: { id: contact.id },
        relations: ['tags'],
      });

      if (!updatedContact) {
        return c.json({ success: false, message: 'Contact not found after update' }, 500);
      }

      // Calculate session info (same as chat.controller.ts)
      const now = new Date();
      const sessionExpiresAt = updatedContact.sessionExpiresAt;
      const isSessionActive = sessionExpiresAt ? now < new Date(sessionExpiresAt) : false;
      const sessionRemainingSeconds = sessionExpiresAt 
        ? Math.max(0, Math.floor((new Date(sessionExpiresAt).getTime() - now.getTime()) / 1000))
        : 0;

      // Return enriched contact with session info
      const enrichedContact = {
        ...updatedContact,
        isSessionActive,
        sessionRemainingSeconds,
      };

      return c.json({
        success: true,
        message: 'Tag added successfully',
        data: enrichedContact,
      });
    } catch (error: any) {
      console.error('Error adding tag to contact:', error);
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  /**
   * DELETE /api/v1/chat/contacts/:contactId/tags/:tagId
   * Remove tag from contact
   */
  static async removeTag(c: Context) {
    try {
      const contactId = c.req.param('contactId');
      const tagId = c.req.param('tagId');

      const contactRepo = AppDataSource.getRepository(Contact);

      // Load contact with existing tags
      const contact = await contactRepo.findOne({
        where: { id: contactId },
        relations: ['tags'],
      });

      if (!contact) {
        return c.json({ success: false, message: 'Contact not found' }, 404);
      }

      // Filter out the tag to remove
      const initialCount = contact.tags.length;
      contact.tags = contact.tags.filter(t => t.id !== tagId);

      if (contact.tags.length < initialCount) {
        await contactRepo.save(contact);
      }


      // Re-fetch to ensure fresh state
      const updatedContact = await contactRepo.findOne({
        where: { id: contact.id },
        relations: ['tags'],
      });

      if (!updatedContact) {
        return c.json({ success: false, message: 'Contact not found after update' }, 500);
      }

      // Calculate session info (same as chat.controller.ts)
      const now = new Date();
      const sessionExpiresAt = updatedContact.sessionExpiresAt;
      const isSessionActive = sessionExpiresAt ? now < new Date(sessionExpiresAt) : false;
      const sessionRemainingSeconds = sessionExpiresAt 
        ? Math.max(0, Math.floor((new Date(sessionExpiresAt).getTime() - now.getTime()) / 1000))
        : 0;

      // Return enriched contact with session info
      const enrichedContact = {
        ...updatedContact,
        isSessionActive,
        sessionRemainingSeconds,
      };

      return c.json({
        success: true,
        message: 'Tag removed successfully',
        data: enrichedContact,
      });
    } catch (error: any) {
      console.error('Error removing tag from contact:', error);
      return c.json({ success: false, message: error.message }, 500);
    }
  }
}

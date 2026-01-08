/**
 * Tag Controller
 * Handles tag management (CRUD)
 */

import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { Tag } from '../models/Tag';
import { withPermissions } from '../utils/controller.decorator';

export class TagController {
  /**
   * Permission definitions
   */
  static permissions = {
    getAll: 'chat-index',
    create: 'chat-store',
    delete: 'chat-destroy',
  };

  /**
   * GET /api/v1/tags
   * List all tags
   */
  static async getAll(c: Context) {
    try {
      const tagRepo = AppDataSource.getRepository(Tag);
      const tags = await tagRepo.find({
        order: { name: 'ASC' },
      });

      return c.json({
        success: true,
        data: tags,
      });
    } catch (error: any) {
      console.error('Error getting tags:', error);
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  /**
   * POST /api/v1/tags
   * Create a new tag
   */
  static async create(c: Context) {
    try {
      const body = await c.req.json();
      const { name, color } = body;

      if (!name) {
        return c.json({ success: false, message: 'Name is required' }, 400);
      }

      const tagRepo = AppDataSource.getRepository(Tag);
      
      // Check duplicate
      const existing = await tagRepo.findOne({ where: { name } });
      if (existing) {
        // If tag exists, return it (Find or Create behavior)
        return c.json({
          success: true,
          message: 'Tag already exists',
          data: existing,
        });
      }

      const tag = tagRepo.create({
        name,
        color: color || 'blue',
      });

      await tagRepo.save(tag);

      return c.json({
        success: true,
        message: 'Tag created successfully',
        data: tag,
      }, 201);
    } catch (error: any) {
      console.error('Error creating tag:', error);
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  /**
   * DELETE /api/v1/tags/:id
   * Delete a tag
   */
  static async delete(c: Context) {
    try {
      const id = c.req.param('id');
      const tagRepo = AppDataSource.getRepository(Tag);

      const result = await tagRepo.delete(id);

      if (result.affected === 0) {
        return c.json({ success: false, message: 'Tag not found' }, 404);
      }

      return c.json({
        success: true,
        message: 'Tag deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      return c.json({ success: false, message: error.message }, 500);
    }
  }
}

export const TagControllerWithPermissions = withPermissions(
  TagController,
  TagController.permissions
);


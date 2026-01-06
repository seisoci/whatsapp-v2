
import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { QuickReply } from '../models/QuickReply';

export class QuickReplyController {
  static async index(c: Context) {
    try {
      const user = c.get('user');
      const quickReplies = await AppDataSource.getRepository(QuickReply).find({
        where: { userId: user.userId },
        order: { createdAt: 'DESC' },
      });

      return c.json({
        success: true,
        data: quickReplies,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Error fetching quick replies',
        },
        500
      );
    }
  }

  static async create(c: Context) {
    try {
      const user = c.get('user');
      const { shortcut, text } = await c.req.json();

      if (!text) {
        return c.json(
          {
            success: false,
            message: 'Text is required',
          },
          400
        );
      }

      const quickReply = new QuickReply();
      quickReply.userId = user.userId;
      quickReply.shortcut = shortcut;
      quickReply.text = text;

      await AppDataSource.getRepository(QuickReply).save(quickReply);

      return c.json({
        success: true,
        data: quickReply,
        message: 'Quick reply created successfully',
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Error creating quick reply',
        },
        500
      );
    }
  }

  static async update(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      const { shortcut, text } = await c.req.json();

      const quickReplyRepository = AppDataSource.getRepository(QuickReply);
      const quickReply = await quickReplyRepository.findOne({
        where: { id, userId: user.userId },
      });

      if (!quickReply) {
        return c.json(
          {
            success: false,
            message: 'Quick reply not found',
          },
          404
        );
      }

      if (shortcut !== undefined) quickReply.shortcut = shortcut;
      if (text !== undefined) quickReply.text = text;

      await quickReplyRepository.save(quickReply);

      return c.json({
        success: true,
        data: quickReply,
        message: 'Quick reply updated successfully',
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Error updating quick reply',
        },
        500
      );
    }
  }

  static async delete(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');

      const quickReplyRepository = AppDataSource.getRepository(QuickReply);
      const quickReply = await quickReplyRepository.findOne({
        where: { id, userId: user.userId },
      });

      if (!quickReply) {
        return c.json(
          {
            success: false,
            message: 'Quick reply not found',
          },
          404
        );
      }

      await quickReplyRepository.remove(quickReply);

      return c.json({
        success: true,
        message: 'Quick reply deleted successfully',
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Error deleting quick reply',
        },
        500
      );
    }
  }
}

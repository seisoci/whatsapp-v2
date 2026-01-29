import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { MessageQueue } from '../models/MessageQueue';
import { z } from 'zod';

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(10000).default(25),
  queue_status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  template_name: z.string().optional(),
  is_billable: z.enum(['true', 'false']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export class MessageQueueController {
  // List all message queues with pagination and filters
  static async index(c: Context) {
    try {
      const query = c.req.query();
      const validation = listQuerySchema.safeParse(query);

      if (!validation.success) {
        return c.json({
          success: false,
          message: 'Validation error',
          errors: validation.error.flatten().fieldErrors,
        }, 400);
      }

      const { page, limit, queue_status, template_name, is_billable, date_from, date_to } = validation.data;
      const offset = (page - 1) * limit;

      const repo = AppDataSource.getRepository(MessageQueue);
      const qb = repo.createQueryBuilder('mq')
        .leftJoinAndSelect('mq.apiEndpoint', 'apiEndpoint')
        .leftJoinAndSelect('mq.user', 'user')
        .orderBy('mq.createdAt', 'DESC');

      if (queue_status) {
        qb.andWhere('mq.queueStatus = :queue_status', { queue_status });
      }
      if (template_name) {
        qb.andWhere('mq.templateName ILIKE :template_name', { template_name: `%${template_name}%` });
      }
      if (is_billable !== undefined) {
        qb.andWhere('mq.isBillable = :is_billable', { is_billable: is_billable === 'true' });
      }
      if (date_from) {
        qb.andWhere('mq.createdAt >= :date_from', { date_from: new Date(date_from) });
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        qb.andWhere('mq.createdAt <= :date_to', { date_to: endDate });
      }

      const total = await qb.getCount();
      const items = await qb.skip(offset).take(limit).getMany();

      return c.json({
        success: true,
        data: items.map((item) => ({
          id: item.id,
          message_id: item.messageId,
          api_endpoint_id: item.apiEndpointId,
          api_endpoint_name: item.apiEndpoint?.name || null,
          phone_number_id: item.phoneNumberId,
          contact_id: item.contactId,
          user_id: item.userId,
          user_name: item.user?.username || null,
          recipient_phone: item.recipientPhone,
          template_name: item.templateName,
          template_language: item.templateLanguage,
          template_category: item.templateCategory,
          template_components: item.templateComponents,
          ip_address: item.ipAddress,
          api_key_masked: item.apiKeyMasked,
          user_agent: item.userAgent,
          device_info: item.deviceInfo,
          request_headers: item.requestHeaders,
          queue_status: item.queueStatus,
          message_status: item.messageStatus,
          wamid: item.wamid,
          is_billable: item.isBillable,
          error_message: item.errorMessage,
          error_code: item.errorCode,
          attempts: item.attempts,
          max_attempts: item.maxAttempts,
          next_retry_at: item.nextRetryAt,
          scheduled_at: item.scheduledAt,
          processed_at: item.processedAt,
          completed_at: item.completedAt,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error fetching message queues:', error);
      return c.json({
        success: false,
        message: 'Failed to fetch message queues',
        error: error.message,
      }, 500);
    }
  }

  // Get single message queue by ID
  static async show(c: Context) {
    try {
      const id = c.req.param('id');
      const repo = AppDataSource.getRepository(MessageQueue);

      const item = await repo.findOne({
        where: { id },
        relations: ['apiEndpoint', 'user', 'message', 'contact', 'phoneNumber'],
      });

      if (!item) {
        return c.json({
          success: false,
          message: 'Message queue not found',
        }, 404);
      }

      return c.json({
        success: true,
        data: {
          id: item.id,
          message_id: item.messageId,
          api_endpoint_id: item.apiEndpointId,
          api_endpoint_name: item.apiEndpoint?.name || null,
          phone_number_id: item.phoneNumberId,
          contact_id: item.contactId,
          user_id: item.userId,
          user_name: item.user?.username || null,
          recipient_phone: item.recipientPhone,
          template_name: item.templateName,
          template_language: item.templateLanguage,
          template_category: item.templateCategory,
          template_components: item.templateComponents,
          ip_address: item.ipAddress,
          api_key_masked: item.apiKeyMasked,
          user_agent: item.userAgent,
          device_info: item.deviceInfo,
          request_headers: item.requestHeaders,
          queue_status: item.queueStatus,
          message_status: item.messageStatus,
          wamid: item.wamid,
          is_billable: item.isBillable,
          error_message: item.errorMessage,
          error_code: item.errorCode,
          attempts: item.attempts,
          max_attempts: item.maxAttempts,
          next_retry_at: item.nextRetryAt,
          scheduled_at: item.scheduledAt,
          processed_at: item.processedAt,
          completed_at: item.completedAt,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error fetching message queue:', error);
      return c.json({
        success: false,
        message: 'Failed to fetch message queue',
        error: error.message,
      }, 500);
    }
  }
}

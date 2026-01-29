import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { PhoneNumber } from '../models/PhoneNumber';
import { ApiEndpoint } from '../models/ApiEndpoint';
import { Contact } from '../models/Contact';
import { MessageQueue } from '../models/MessageQueue';
import { templateCacheService } from '../services/template-cache.service';
import { getClientIP } from '../middlewares/ipFilter.middleware';
import { whatsappTemplateQueue } from '../config/queue';
import { sendTemplateSchema } from '../validators/public-message.validator';
import { UAParser } from 'ua-parser-js';

export class PublicMessageController {

  static async sendTemplate(c: Context) {
    // Capture request metadata early
    const clientIP = getClientIP(c);
    const ipAddress = clientIP !== 'unknown' ? clientIP : null;

    const rawApiKey = c.req.header('X-API-Key') || '';
    const apiKeyMasked = rawApiKey.length <= 8
      ? '****' + rawApiKey.slice(-2)
      : rawApiKey.slice(0, 3) + '****' + rawApiKey.slice(-4);

    const userAgent = c.req.header('user-agent') || '';
    const ua = UAParser(userAgent);
    const deviceInfo = [
      ua.browser.name && (ua.browser.version ? `${ua.browser.name} ${ua.browser.version}` : ua.browser.name),
      ua.os.name && (ua.os.version ? `${ua.os.name} ${ua.os.version}` : ua.os.name),
      ua.device.model,
    ].filter(Boolean).join(' / ') || 'Unknown';

    const requestHeaders: Record<string, string | null> = {
      'content-type': c.req.header('content-type') || null,
      'user-agent': userAgent || null,
      'x-forwarded-for': c.req.header('x-forwarded-for') || null,
      'origin': c.req.header('origin') || null,
      'referer': c.req.header('referer') || null,
      'accept': c.req.header('accept') || null,
    };

    const mqRepo = AppDataSource.getRepository(MessageQueue);

    try {
      // 1. Validate Input
      const body = await c.req.json();
      const validation = sendTemplateSchema.safeParse(body);

      if (!validation.success) {
        return c.json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors,
        }, 400);
      }

      const { phone_number, template_name, template } = validation.data;

      // 2. API Endpoint from middleware
      const apiEndpoint = c.get('apiEndpoint') as ApiEndpoint;

      // 3. Find Sender Phone Number
      const phoneNumberRepo = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepo.findOne({
        where: { isActive: true },
        order: { createdAt: 'ASC' }
      });

      if (!phoneNumber) {
        return c.json({
          success: false,
          message: 'No active WhatsApp sender number found.',
        }, 503);
      }

      // 4. Resolve/Create Contact
      const contactRepo = AppDataSource.getRepository(Contact);
      let contact = await contactRepo.findOne({
        where: { waId: phone_number }
      });

      if (!contact) {
        contact = contactRepo.create({
          waId: phone_number,
          phoneNumber: phone_number,
          profileName: phone_number,
          isSessionActive: false,
          phoneNumberId: phoneNumber.id
        });
        await contactRepo.save(contact);
      }

      // 5. Lookup template category from Redis/WhatsApp API
      let templateCategory: string | null = null;
      try {
        const templateDef = await templateCacheService.getTemplateByPhoneNumber(
          phoneNumber.id,
          template_name,
          'id'
        );
        if (templateDef?.category) {
          templateCategory = templateDef.category.toUpperCase();
        }
      } catch (err) {
        console.warn('[PublicMessage] Failed to lookup template category:', err);
      }

      // 6. Create queue record (status: pending)
      const queueRecord = mqRepo.create({
        apiEndpointId: apiEndpoint?.id || null,
        phoneNumberId: phoneNumber.id,
        contactId: contact.id,
        userId: apiEndpoint?.creator?.id || null,
        recipientPhone: phone_number,
        templateName: template_name,
        templateLanguage: 'id',
        templateComponents: template.length > 0 ? template : null,
        ipAddress: ipAddress,
        apiKeyMasked: apiKeyMasked,
        userAgent: userAgent || null,
        deviceInfo: deviceInfo,
        requestHeaders: requestHeaders,
        templateCategory: templateCategory,
        queueStatus: 'pending',
        isBillable: true,
        attempts: 0,
      });
      await mqRepo.save(queueRecord);

      // 7. Immediately dispatch to BullMQ (non-blocking)
      //    If Redis fails, record stays pending — cron watchdog will pick it up
      try {
        const job = await whatsappTemplateQueue.add(
          'send-template',
          { queueId: queueRecord.id },
          { jobId: `mq-${queueRecord.id}`, attempts: 1 }
        );
        queueRecord.queueStatus = 'queued';
        queueRecord.redisJobId = job.id || null;
        queueRecord.lastDispatchedAt = new Date();
        await mqRepo.save(queueRecord);
      } catch (dispatchError: any) {
        // Redis unavailable — record stays pending, cron will recover
        console.warn('[PublicMessage] BullMQ dispatch failed, cron will recover:', dispatchError.message);
      }

      return c.json({
        success: true,
        message: 'Message queued successfully',
        data: {
          queue_id: queueRecord.id,
          status: queueRecord.queueStatus,
        }
      });

    } catch (error: any) {
      console.error('Public Send Template Error:', error);
      return c.json({
        success: false,
        message: error.message || 'Failed to send message',
      }, 500);
    }
  }
}

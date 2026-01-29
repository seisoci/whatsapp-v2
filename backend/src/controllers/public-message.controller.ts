import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { PhoneNumber } from '../models/PhoneNumber';
import { WhatsAppMessagingService } from '../services/whatsapp-messaging.service';
import { z } from 'zod';
import { ApiEndpoint } from '../models/ApiEndpoint';
import { Contact } from '../models/Contact';
import { MessageQueue } from '../models/MessageQueue';
import { templateCacheService } from '../services/template-cache.service';

// Schema Validation
const sendTemplateSchema = z.object({
  phone_number: z.string().min(10, 'Phone number required'),
  template_name: z.string().min(1, 'Template name required'),
  template: z.array(z.any()).optional().default([]),
});

/**
 * Parse User-Agent string into a human-readable device info string.
 */
function parseDeviceInfo(ua: string): string {
  if (!ua) return 'Unknown';

  // Postman
  if (ua.includes('PostmanRuntime')) return 'Postman';
  // curl
  if (ua.startsWith('curl/')) return 'cURL';
  // Insomnia
  if (ua.includes('insomnia')) return 'Insomnia';
  // HTTPie
  if (ua.includes('HTTPie')) return 'HTTPie';

  // Browser detection
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // OS
  if (ua.includes('Windows NT 10')) os = 'Windows 10';
  else if (ua.includes('Windows NT 11') || (ua.includes('Windows NT 10') && ua.includes('Win64'))) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Browser
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

  return `${browser} / ${os}`;
}

/**
 * Mask an API key for safe storage: "sk-abc...xyz" → "sk-****xyz"
 */
function maskApiKey(key: string): string {
  if (!key) return '****';
  if (key.length <= 8) return '****' + key.slice(-2);
  return key.slice(0, 3) + '****' + key.slice(-4);
}

export class PublicMessageController {

  static async sendTemplate(c: Context) {
    // Capture request metadata early
    const ipAddress = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || null;

    const rawApiKey = c.req.header('X-API-Key') || '';
    const apiKeyMasked = maskApiKey(rawApiKey);

    const userAgent = c.req.header('user-agent') || '';
    const deviceInfo = parseDeviceInfo(userAgent);

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

      // 6. Create queue record (status: processing)
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
        queueStatus: 'processing',
        isBillable: true,
        billableCategory: templateCategory?.toLowerCase() || null,
        attempts: 1,
        processedAt: new Date(),
      });
      await mqRepo.save(queueRecord);

      // 7. Send Message
      try {
        const result = await WhatsAppMessagingService.sendTemplateMessage({
          phoneNumberId: phoneNumber.phoneNumberId,
          accessToken: phoneNumber.accessToken,
          to: phone_number,
          templateName: template_name,
          templateLanguage: 'id',
          components: template,
          contactId: contact.id,
          internalPhoneNumberId: phoneNumber.id,
          userId: apiEndpoint.creator?.id,
        });

        const wamid = result.messages?.[0]?.id || null;
        const savedMessage = result.savedMessage;

        // Update queue: completed
        queueRecord.queueStatus = 'completed';
        queueRecord.messageStatus = 'sent';
        queueRecord.wamid = wamid;
        
        if (savedMessage) {
          queueRecord.messageId = savedMessage.id;
        }

        queueRecord.completedAt = new Date();
        await mqRepo.save(queueRecord);

        return c.json({
          success: true,
          message: 'Message sent successfully',
          data: {
            wamid: wamid,
            queue_id: queueRecord.id,
          }
        });

      } catch (sendError: any) {
        // Update queue: failed
        queueRecord.queueStatus = 'failed';
        queueRecord.messageStatus = 'failed';
        queueRecord.errorMessage = sendError.message || 'Unknown send error';
        queueRecord.errorCode = sendError.code || sendError.error_code || null;
        queueRecord.completedAt = new Date();
        queueRecord.isBillable = false; // Failed before reaching WhatsApp = not billable
        await mqRepo.save(queueRecord);

        throw sendError; // Re-throw for outer catch
      }

    } catch (error: any) {
      console.error('Public Send Template Error:', error);
      return c.json({
        success: false,
        message: error.message || 'Failed to send message',
      }, 500);
    }
  }
}

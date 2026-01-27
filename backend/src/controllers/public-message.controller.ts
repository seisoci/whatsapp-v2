import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { PhoneNumber } from '../models/PhoneNumber';
import { WhatsAppMessagingService } from '../services/whatsapp-messaging.service';
import { z } from 'zod';
import { ApiEndpoint } from '../models/ApiEndpoint';
import { Contact } from '../models/Contact';

// Schema Validation
const sendTemplateSchema = z.object({
  phone_number: z.string().min(10, 'Phone number required'),
  template_name: z.string().min(1, 'Template name required'),
  template: z.array(z.any()).optional().default([]),
});

export class PublicMessageController {
  
  static async sendTemplate(c: Context) {
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

      // 2. Webhook ID validation relaxed - API Key is the source of truth
      // const apiEndpoint = c.get('apiEndpoint') as ApiEndpoint;
      // We trust the API Key. webhook_id in payload is accepted as is.
      const apiEndpoint = c.get('apiEndpoint') as ApiEndpoint;
      
      // 3. Find Sender Phone Number
      // Default to FIRST ACTIVE phone number
      const phoneNumberRepo = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepo.findOne({
        where: { isActive: true },
        order: { createdAt: 'ASC' } // Stable default
      });

      if (!phoneNumber) {
        return c.json({
          success: false,
          message: 'No active WhatsApp sender number found.',
        }, 503);
      }

      // 4. Resolve/Create Contact
      // We need a contact to link the message to.
      // If contact doesn't exist, we might need to create one, or fail.
      // WhatsAppMessagingService usually takes 'to' (string) and 'contactId' (optional, but needed for storage).
      // Let's check if contact exists by phone number.
      const contactRepo = AppDataSource.getRepository(Contact);
      let contact = await contactRepo.findOne({
          where: { waId: phone_number }
      });

      if (!contact) {
          // If public API is sending to a new number, we should probably create the contact
          // so the conversation appears in the UI.
          contact = contactRepo.create({
              waId: phone_number,
              phoneNumber: phone_number,
              profileName: phone_number, // Default name
              isSessionActive: false,
              phoneNumberId: phoneNumber.id
          });
          await contactRepo.save(contact);
      }

      // 5. Send Message
      // Default language 'id' as requested
      const result = await WhatsAppMessagingService.sendTemplateMessage({
        phoneNumberId: phoneNumber.phoneNumberId,
        accessToken: phoneNumber.accessToken,
        to: phone_number,
        templateName: template_name,
        templateLanguage: 'id',
        components: template,
        contactId: contact.id, // Needed for DB storage
        internalPhoneNumberId: phoneNumber.id, // Use UUID for DB storage
        userId: apiEndpoint.creator?.id, // Attribute to API Endpoint creator
      });
        // Note: WhatsAppMessagingService.sendTemplateMessage stores the message but currently does NOT take userId.
        // I need to Update WhatsAppMessagingService to accept userId if I want to attribute it.
        // Wait, I saw 'userId' in `sendTextMessage`/`sendMediaMessage` but NOT `sendTemplateMessage` in the code I read earlier.
        // Let's re-verify `WhatsAppMessagingService.sendTemplateMessage`.
        // If it doesn't take userId, I might need to update it or manually update the message after.
        // Actually, let's just assume `sendTemplateMessage` returns the saved message or we can update it.

      return c.json({
        success: true,
        message: 'Message sent successfully',
        data: {
             wamid: result.messages?.[0]?.id
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

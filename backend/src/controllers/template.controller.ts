import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { PhoneNumber } from '../models/PhoneNumber';
import { WhatsAppService } from '../services/whatsapp.service';
import { withPermissions } from '../utils/controller.decorator';

export class TemplateController {
  /**
   * Permission definitions
   */
  static permissions = {
    index: 'template-index',
    show: 'template-index',
    store: 'template-store',
    update: 'template-update',
    destroy: 'template-destroy',
  };

  /**
   * Get all message templates from all phone numbers
   * Fetches templates from WhatsApp API for each registered phone number
   */
  static async index(c: Context) {
    try {
      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);

      // Get all active phone numbers with their credentials
      const phoneNumbers = await phoneNumberRepository.find({
        where: { isActive: true },
        select: {
          id: true,
          phoneNumberId: true,
          accessToken: true,
          wabaId: true,
          name: true,
        },
      });

      if (phoneNumbers.length === 0) {
        return c.json(
          {
            success: true,
            data: [],
            message: 'No phone numbers registered',
          },
          200
        );
      }

      // Fetch templates from all phone numbers
      const allTemplates: any[] = [];

      await Promise.all(
        phoneNumbers.map(async (phone) => {
          try {
            // Fetch display phone number from WhatsApp API
            let displayPhoneNumber = phone.phoneNumberId;
            try {
              const phoneInfo = await WhatsAppService.getPhoneNumberInfo(
                phone.phoneNumberId,
                phone.accessToken
              );
              displayPhoneNumber = phoneInfo.display_phone_number || phone.phoneNumberId;
            } catch (err) {
              // If failed to get phone info, use phoneNumberId as fallback
              console.error(`Failed to get phone info for ${phone.phoneNumberId}`);
            }

            // Fetch templates with high limit to get all templates
            const result = await WhatsAppService.getMessageTemplates(
              phone.wabaId,
              phone.accessToken,
              { limit: 1000 } // Set high limit to fetch all templates
            );

            // Add phone number info to each template
            if (result.data && Array.isArray(result.data)) {
              result.data.forEach((template: any) => {
                allTemplates.push({
                  ...template,
                  phoneNumberId: phone.phoneNumberId,
                  phoneNumberName: phone.name,
                  displayPhoneNumber: displayPhoneNumber,
                  wabaId: phone.wabaId,
                });
              });
            }
          } catch (error: any) {
            console.error(`Error fetching templates for ${phone.phoneNumberId}:`, error);
            // Continue with other phone numbers even if one fails
          }
        })
      );

      return c.json(
        {
          success: true,
          data: allTemplates,
        },
        200
      );
    } catch (error: any) {
      console.error('Get templates error:', error);
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
   * Get single template by ID
   */
  static async show(c: Context) {
    try {
      const { id: templateId } = c.req.param();
      const { phoneNumberId } = c.req.query();

      if (!phoneNumberId) {
        return c.json(
          {
            success: false,
            message: 'Phone Number ID harus disediakan.',
          },
          400
        );
      }

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({
        where: { phoneNumberId },
      });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      const template = await WhatsAppService.getMessageTemplateById(
        templateId,
        phoneNumber.accessToken
      );

      return c.json(
        {
          success: true,
          data: {
            ...template,
            phoneNumberId: phoneNumber.phoneNumberId,
            phoneNumberName: phoneNumber.name,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Get template error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Create new message template
   */
  static async store(c: Context) {
    try {
      const body = await c.req.json();
      const { phoneNumberId, name, language, category, components } = body;

      if (!phoneNumberId || !name || !language || !category || !components) {
        return c.json(
          {
            success: false,
            message: 'Phone Number ID, name, language, category, dan components harus disediakan.',
          },
          400
        );
      }

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({
        where: { phoneNumberId },
      });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      const templateData = {
        name,
        language,
        category,
        components,
      };

      const result = await WhatsAppService.createMessageTemplate(
        phoneNumber.wabaId,
        phoneNumber.accessToken,
        templateData
      );

      return c.json(
        {
          success: true,
          message: 'Template berhasil dibuat.',
          data: result,
        },
        201
      );
    } catch (error: any) {
      console.error('Create template error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal membuat template.',
        },
        500
      );
    }
  }

  /**
   * Update message template
   */
  static async update(c: Context) {
    try {
      const { id: templateId } = c.req.param();
      const body = await c.req.json();
      const { phoneNumberId, ...templateData } = body;

      if (!phoneNumberId) {
        return c.json(
          {
            success: false,
            message: 'Phone Number ID harus disediakan.',
          },
          400
        );
      }

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({
        where: { phoneNumberId },
      });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      const result = await WhatsAppService.updateMessageTemplate(
        templateId,
        phoneNumber.accessToken,
        templateData
      );

      return c.json(
        {
          success: true,
          message: 'Template berhasil diupdate.',
          data: result,
        },
        200
      );
    } catch (error: any) {
      console.error('Update template error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal update template.',
        },
        500
      );
    }
  }

  /**
   * Delete message template
   */
  static async destroy(c: Context) {
    try {
      const { id: templateId } = c.req.param();
      const { phoneNumberId, templateName } = c.req.query();

      if (!phoneNumberId || !templateName) {
        return c.json(
          {
            success: false,
            message: 'Phone Number ID dan template name harus disediakan.',
          },
          400
        );
      }

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({
        where: { phoneNumberId },
      });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      await WhatsAppService.deleteMessageTemplate(
        phoneNumber.wabaId,
        templateName as string,
        phoneNumber.accessToken
      );

      return c.json(
        {
          success: true,
          message: 'Template berhasil dihapus.',
        },
        200
      );
    } catch (error: any) {
      console.error('Delete template error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal menghapus template.',
        },
        500
      );
    }
  }
}

// Export controller with permission decorators
export const TemplateControllerWithPermissions = withPermissions(
  TemplateController,
  TemplateController.permissions
);

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
      // Parse form data (supports both JSON and multipart)
      const contentType = c.req.header('content-type') || '';
      let phoneNumberId, name, language, category, components, mediaFile;

      if (contentType.includes('multipart/form-data')) {
        // Handle multipart form data with file
        const body = await c.req.parseBody();
        phoneNumberId = body.phoneNumberId as string;
        name = body.name as string;
        language = body.language as string;
        category = body.category as string;
        
        // Parse components if it's a string
        if (typeof body.components === 'string') {
          components = JSON.parse(body.components);
        } else {
          components = body.components;
        }
        
        // Get media file if provided
        mediaFile = body.mediaFile as File | undefined;
      } else {
        // Handle regular JSON data
        const body = await c.req.json();
        phoneNumberId = body.phoneNumberId;
        name = body.name;
        language = body.language;
        category = body.category;
        components = body.components;
      }

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

      // Upload media file if provided and header is media type
      if (mediaFile && Array.isArray(components)) {
        const headerComponent = components.find((c: any) => c.type === 'HEADER');
        
        if (headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format)) {
          console.log('[Template Create] Uploading media file to WhatsApp API...');
          
          try {
            // Convert File to Buffer
            const arrayBuffer = await mediaFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Upload to WhatsApp API using Resumable Upload (required for templates)
            const mediaHandle = await WhatsAppService.uploadMediaForTemplate(
              phoneNumber.accessToken,
              buffer,
              mediaFile.type
            );
            
            if (mediaHandle) {
              // Update header component with media handle
              headerComponent.example = {
                header_handle: [mediaHandle],
              };
              console.log('[Template Create] Media uploaded, Handle:', mediaHandle);
            } else {
              return c.json(
                {
                  success: false,
                  message: 'Gagal upload media ke WhatsApp API (No Handle).',
                },
                500
              );
            }
          } catch (uploadError: any) {
            console.error('[Template Create] Media upload error:', uploadError);
            return c.json(
              {
                success: false,
                message: `Gagal upload media: ${uploadError.message}`,
              },
              500
            );
          }
        }
      }

      // Sanitize components before sending to WhatsApp
      const sanitizedComponents = components.map((c: any) => {
        // Remove 'text' from media headers
        if (c.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(c.format)) {
          const { text, ...rest } = c;
          return rest;
        }
        return c;
      });

      const templateData = {
        name,
        language,
        category,
        components: sanitizedComponents,
      };

      console.log('[Template Create] Sending payload to WhatsApp:', JSON.stringify(templateData, null, 2));

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

      console.log('[Template Update] Received request for template:', templateId);
      console.log('[Template Update] Data:', JSON.stringify({ phoneNumberId, components: templateData.components?.length }, null, 2));

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

      // Validate components
      if (!templateData.components || !Array.isArray(templateData.components)) {
        return c.json(
          {
            success: false,
            message: 'Components harus berupa array.',
          },
          400
        );
      }

      // For update, we can only update components. Name, language, and category are immutable.
      const components = templateData.components;

      // Log media headers for debugging (but don't reject URLs - they might be from original template)
      for (const component of components) {
        if (component.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(component.format)) {
          const handle = component.example?.header_handle?.[0];
          
          if (!handle) {
            console.warn('[Template Update] Media header missing handle - WhatsApp API may reject this:', component.format);
          } else if (typeof handle === 'string' && (handle.startsWith('http://') || handle.startsWith('https://'))) {
            console.log('[Template Update] Media header contains URL (preserved from original):', handle.substring(0, 50));
            // Don't reject - this might be the original template's URL, which WhatsApp API may accept for existing templates
          } else {
            console.log('[Template Update] Valid media handle found:', handle);
          }
        }
      }

      const updateData = {
        components: components,
      };

      console.log('[Template Update] Sending to WhatsApp API:', JSON.stringify(updateData, null, 2));

      const result = await WhatsAppService.updateMessageTemplate(
        templateId,
        phoneNumber.accessToken,
        updateData,
      );

      console.log('[Template Update] Success:', result);

      return c.json(
        {
          success: true,
          message: 'Template berhasil diupdate.',
          data: result,
        },
        200
      );
    } catch (error: any) {
      console.error('[Template Update] Error:', error);
      
      // Try to parse WhatsApp API error if it's a JSON string
      let errorMessage = error.message || 'Gagal update template.';
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error?.message) {
          errorMessage = parsedError.error.message;
        } else if (parsedError.error?.error_user_msg) {
          errorMessage = parsedError.error.error_user_msg;
        } else if (parsedError.error?.error_user_title) {
          errorMessage = parsedError.error.error_user_title + ': ' + (parsedError.error.error_user_msg || parsedError.error.message);
        }
      } catch (e) {
        // Not a JSON error, use as is
      }

      return c.json(
        {
          success: false,
          message: errorMessage,
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

import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { PhoneNumber } from '../models/PhoneNumber';
import { WhatsAppService } from '../services/whatsapp.service';
import { withPermissions } from '../utils/controller.decorator';

/**
 * WhatsApp Media Controller
 * Handle media uploads directly to WhatsApp Cloud API
 */
export class WhatsAppMediaController {
  
  static permissions = {
    upload: 'chat-store',
  };

  /**
   * Upload media to WhatsApp (get handle)
   */
  static async upload(c: Context) {
    try {
      const body = await c.req.parseBody();
      const file = body['file'] as File;
      const phoneNumberId = body['phoneNumberId'] as string;

      if (!file) {
        return c.json({ success: false, message: 'File wajib diisi' }, 400);
      }

      if (!phoneNumberId) {
        return c.json({ success: false, message: 'phoneNumberId wajib diisi' }, 400);
      }

      // Get phone number for access token
      const phoneNumberRepo = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepo.findOne({
        where: { phoneNumberId },
      });

      if (!phoneNumber) {
        return c.json({ success: false, message: 'Phone number tidak ditemukan' }, 404);
      }

      // Validate file size/type if needed, but WhatsAppService handles API errors
      
      const buffer = await file.arrayBuffer();
      
      // Upload to WhatsApp
      const result = await WhatsAppService.uploadMedia(
        phoneNumberId,
        phoneNumber.accessToken,
        Buffer.from(buffer),
        file.name,
        file.type
      );

      return c.json({
        success: true,
        message: 'Media berhasil diupload ke WhatsApp',
        data: {
          id: result.id, // This is the handle needed for templates
        }
      });

    } catch (error: any) {
      console.error('Media upload error:', error);
      return c.json({
        success: false,
        message: error.message || 'Gagal upload media ke WhatsApp'
      }, 500);
    }
  }
}

export const WhatsAppMediaControllerWithPermissions = withPermissions(
  WhatsAppMediaController,
  WhatsAppMediaController.permissions
);

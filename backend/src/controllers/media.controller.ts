import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { PhoneNumber } from '../models/PhoneNumber';
import { WhatsAppService } from '../services/whatsapp.service';
import { storageService } from '../services/storage.service';

export class MediaController {
  /**
   * Upload media file to WhatsApp API
   * Returns media handle (ID) to be used in template creation
   */
  static async upload(c: Context) {
    try {
      const body = await c.req.parseBody();
      const phoneNumberId = body.phoneNumberId as string;
      const file = body.file as File;

      if (!phoneNumberId) {
        return c.json(
          {
            success: false,
            message: 'Phone Number ID harus disediakan.',
          },
          400
        );
      }

      if (!file) {
        return c.json(
          {
            success: false,
            message: 'File harus disediakan.',
          },
          400
        );
      }

      // Validate file size based on type
      const maxSizes: Record<string, number> = {
        'image/jpeg': 5 * 1024 * 1024, // 5MB
        'image/png': 5 * 1024 * 1024, // 5MB
        'video/mp4': 16 * 1024 * 1024, // 16MB
        'video/3gpp': 16 * 1024 * 1024, // 16MB
        'application/pdf': 100 * 1024 * 1024, // 100MB
        'application/msword': 100 * 1024 * 1024, // 100MB
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          100 * 1024 * 1024, // 100MB
        'application/vnd.ms-excel': 100 * 1024 * 1024, // 100MB
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          100 * 1024 * 1024, // 100MB
        'application/vnd.ms-powerpoint': 100 * 1024 * 1024, // 100MB
        'application/vnd.openxmlformats-officedocument.presentationml.presentation':
          100 * 1024 * 1024, // 100MB
      };

      const maxSize = maxSizes[file.type];
      if (!maxSize) {
        return c.json(
          {
            success: false,
            message: `Tipe file tidak didukung: ${file.type}`,
          },
          400
        );
      }

      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return c.json(
          {
            success: false,
            message: `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB untuk tipe file ini.`,
          },
          400
        );
      }

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      // The frontend may pass either the DB uuid (id) or the WA phone_number_id
      const phoneNumber = await phoneNumberRepository.findOne({
        where: [{ id: phoneNumberId }, { phoneNumberId }],
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

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log('[Media Upload] Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        phoneNumberId,
      });

      // Upload to WhatsApp API
      const result = await WhatsAppService.uploadMedia(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken,
        buffer,
        file.name,
        file.type
      );

      console.log('[Media Upload] Success:', result);

      return c.json(
        {
          success: true,
          message: 'File berhasil diupload.',
          data: {
            id: result.id,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('[Media Upload] Error:', error);

      let errorMessage = error.message || 'Gagal upload file.';

      // Parse WhatsApp API error if it's a JSON string
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error?.message) {
          errorMessage = parsedError.error.message;
        } else if (parsedError.error?.error_user_msg) {
          errorMessage = parsedError.error.error_user_msg;
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
   * Generate a fresh pre-signed URL from a stored base URL or object path
   * GET /media/presign?url=https://s3.itn.net.id/whatsapp/path/to/file.jpg
   */
  static async presign(c: Context) {
    try {
      const rawUrl = c.req.query('url') || c.req.query('path') || '';
      if (!rawUrl) {
        return c.json(
          { success: false, message: 'url or path query param required' },
          400
        );
      }

      // Extract object key from full URL or use path directly
      const bucket = process.env.MINIO_BUCKET || 'whatsapp';
      let objectKey = rawUrl;
      try {
        const parsed = new URL(rawUrl);
        const parts = parsed.pathname.split('/');
        const bucketIdx = parts.indexOf(bucket);
        objectKey =
          bucketIdx !== -1
            ? parts.slice(bucketIdx + 1).join('/')
            : parsed.pathname.replace(/^\//, '');
      } catch {
        // Not a URL, treat as raw object key
      }

      // Generate fresh pre-signed URL valid for 1 hour
      const presignedUrl = await storageService.getFileUrl(objectKey, 3600);
      return c.json({ success: true, url: presignedUrl });
    } catch (error: any) {
      console.error('[Media Presign] Error:', error);
      return c.json(
        { success: false, message: error.message || 'Failed to generate URL' },
        500
      );
    }
  }
}

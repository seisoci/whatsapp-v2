import { Context } from 'hono';
import { storageService } from '../services';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { withPermissions } from '../utils/controller.decorator';

/**
 * Upload Controller
 * Handle file uploads ke MinIO S3
 */
export class UploadController {
  /**
   * Permission definitions
   */
  static permissions = {
    uploadFile: 'chat-store',
    uploadMultipleFiles: 'chat-store',
    uploadAvatar: 'chat-store',
    getFileInfo: 'chat-index',
    downloadFile: 'chat-index',
    listFiles: 'chat-index',
    deleteFile: 'chat-destroy',
  };

  /**
   * Upload single file
   */
  static async uploadFile(c: Context) {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'Unauthorized',
          },
          401
        );
      }

      // Get file from request
      const body = await c.req.parseBody();
      const file = body['file'] as File;

      if (!file) {
        return c.json(
          {
            success: false,
            message: 'File harus disediakan',
          },
          400
        );
      }

      // Validate file type - WhatsApp Cloud API supported types
      const allowedTypes = [
        // Images (5MB limit)
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        // Documents (100MB limit)
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'text/plain', // .txt
        // Videos (16MB limit)
        'video/mp4',
        'video/3gpp',
        // Audio (16MB limit)
        'audio/aac',
        'audio/mp4',
        'audio/mpeg', // .mp3
        'audio/amr',
        'audio/ogg',
        'audio/wav',
        'audio/webm',
      ];

      if (!allowedTypes.includes(file.type)) {
        return c.json(
          {
            success: false,
            message: 'Tipe file tidak didukung',
            allowedTypes,
          },
          400
        );
      }

      // Validate file size based on media type
      // WhatsApp limits: Images=5MB, Audio/Video=16MB, Documents=100MB
      const isDocument = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
      ].includes(file.type);
      
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');
      
      let maxSize: number;
      if (isDocument) {
        maxSize = 100 * 1024 * 1024; // 100MB for documents
      } else if (isVideo || isAudio) {
        maxSize = 16 * 1024 * 1024; // 16MB for video/audio
      } else if (isImage) {
        maxSize = 5 * 1024 * 1024; // 5MB for images
      } else {
        maxSize = 10 * 1024 * 1024; // 10MB default
      }
      
      if (file.size > maxSize) {
        return c.json(
          {
            success: false,
            message: `Ukuran file terlalu besar. Maksimal ${maxSize / 1024 / 1024}MB untuk tipe file ini`,
          },
          400
        );
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to storage
      const result = await storageService.uploadFile(file.name, buffer, file.type, {
        uploadedBy: user.userId,
        originalName: file.name,
      });

      return c.json(
        {
          success: true,
          message: 'File berhasil diupload',
          data: {
            fileName: result.fileName,
            originalName: file.name,
            url: result.url,
            size: result.size,
            contentType: file.type,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal mengupload file',
        },
        500
      );
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(c: Context) {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'Unauthorized',
          },
          401
        );
      }

      const body = await c.req.parseBody();
      const files: File[] = [];

      // Collect all files
      for (const [key, value] of Object.entries(body)) {
        if (value instanceof File) {
          files.push(value);
        }
      }

      if (files.length === 0) {
        return c.json(
          {
            success: false,
            message: 'Tidak ada file yang diupload',
          },
          400
        );
      }

      // Validate max files (max 5 files)
      if (files.length > 5) {
        return c.json(
          {
            success: false,
            message: 'Maksimal 5 file per upload',
          },
          400
        );
      }

      const results = [];
      const errors = [];

      // Upload each file
      for (const file of files) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const result = await storageService.uploadFile(file.name, buffer, file.type, {
            uploadedBy: user.userId,
            originalName: file.name,
          });

          results.push({
            fileName: result.fileName,
            originalName: file.name,
            url: result.url,
            size: result.size,
            contentType: file.type,
          });
        } catch (error: any) {
          errors.push({
            fileName: file.name,
            error: error.message,
          });
        }
      }

      return c.json(
        {
          success: true,
          message: `${results.length} file berhasil diupload, ${errors.length} file gagal`,
          data: {
            uploaded: results,
            failed: errors,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Multiple upload error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal mengupload files',
        },
        500
      );
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(c: Context) {
    try {
      const fileName = c.req.param('fileName');

      if (!fileName) {
        return c.json(
          {
            success: false,
            message: 'Nama file harus disediakan',
          },
          400
        );
      }

      const fileInfo = await storageService.getFileInfo(fileName);

      return c.json(
        {
          success: true,
          data: {
            fileName,
            size: fileInfo.size,
            lastModified: fileInfo.lastModified,
            contentType: fileInfo.metaData['content-type'],
            metadata: fileInfo.metaData,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Get file info error:', error);
      return c.json(
        {
          success: false,
          message: 'File tidak ditemukan',
        },
        404
      );
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(c: Context) {
    try {
      const user = c.get('user');
      const fileName = c.req.param('fileName');

      if (!fileName) {
        return c.json(
          {
            success: false,
            message: 'Nama file harus disediakan',
          },
          400
        );
      }

      // Check if file exists
      const exists = await storageService.fileExists(fileName);

      if (!exists) {
        return c.json(
          {
            success: false,
            message: 'File tidak ditemukan',
          },
          404
        );
      }

      // Optional: Check if user owns the file
      // You can store file metadata in database and check ownership

      await storageService.deleteFile(fileName);

      return c.json(
        {
          success: true,
          message: 'File berhasil dihapus',
        },
        200
      );
    } catch (error: any) {
      console.error('Delete file error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal menghapus file',
        },
        500
      );
    }
  }

  /**
   * List user's files
   */
  static async listFiles(c: Context) {
    try {
      const user = c.get('user');
      const prefix = c.req.query('prefix') || '';

      // List all files (in production, you should filter by user)
      const files = await storageService.listFiles(prefix);

      return c.json(
        {
          success: true,
          data: {
            total: files.length,
            files: files.map((file) => ({
              name: file.name,
              size: file.size,
              lastModified: file.lastModified,
            })),
          },
        },
        200
      );
    } catch (error: any) {
      console.error('List files error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal mengambil daftar file',
        },
        500
      );
    }
  }

  /**
   * Download file
   */
  static async downloadFile(c: Context) {
    try {
      const fileName = c.req.param('fileName');

      if (!fileName) {
        return c.json(
          {
            success: false,
            message: 'Nama file harus disediakan',
          },
          400
        );
      }

      // Get file info for content type
      const fileInfo = await storageService.getFileInfo(fileName);

      // Download file
      const buffer = await storageService.downloadFile(fileName);

      // Set headers
      c.header('Content-Type', fileInfo.metaData['content-type'] || 'application/octet-stream');
      c.header('Content-Disposition', `attachment; filename="${fileName}"`);
      c.header('Content-Length', buffer.length.toString());

      return c.body(buffer as any);
    } catch (error: any) {
      console.error('Download file error:', error);
      return c.json(
        {
          success: false,
          message: 'File tidak ditemukan',
        },
        404
      );
    }
  }

  /**
   * Upload avatar/profile picture
   */
  static async uploadAvatar(c: Context) {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'Unauthorized',
          },
          401
        );
      }

      const body = await c.req.parseBody();
      const file = body['avatar'] as File;

      if (!file) {
        return c.json(
          {
            success: false,
            message: 'Avatar harus disediakan',
          },
          400
        );
      }

      // Validate image type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      if (!allowedTypes.includes(file.type)) {
        return c.json(
          {
            success: false,
            message: 'Hanya file gambar yang diizinkan (JPEG, PNG, GIF, WebP)',
          },
          400
        );
      }

      // Validate size (max 5MB for avatars)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return c.json(
          {
            success: false,
            message: 'Ukuran avatar maksimal 5MB',
          },
          400
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload avatar using service
      const result = await storageService.uploadAvatar(user.userId, buffer, file.type, file.name);

      // TODO: Update user avatar URL in database
      const userRepository = AppDataSource.getRepository(User);
      const userData = await userRepository.findOne({ where: { id: user.userId } });

      if (userData) {
        // If you have avatarUrl field in User model, uncomment this:
        // userData.avatarUrl = result.url;
        // await userRepository.save(userData);
      }

      return c.json(
        {
          success: true,
          message: 'Avatar berhasil diupload',
          data: {
            fileName: result.fileName,
            url: result.url,
            size: result.size,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal mengupload avatar',
        },
        500
      );
    }
  }
}

export const UploadControllerWithPermissions = withPermissions(
  UploadController,
  UploadController.permissions
);


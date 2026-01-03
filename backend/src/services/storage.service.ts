import * as Minio from 'minio';

/**
 * Storage Service - MinIO S3-compatible object storage
 * Centralized service untuk semua operasi file storage
 */
class StorageService {
  private client: Minio.Client;
  private defaultBucket: string;
  private initialized: boolean = false;

  constructor() {
    this.defaultBucket = process.env.MINIO_BUCKET || 'uploads';

    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  /**
   * Initialize storage - create bucket if not exists
   */
  async initialize(): Promise<void> {
    try {
      const bucketExists = await this.client.bucketExists(this.defaultBucket);

      if (!bucketExists) {
        await this.client.makeBucket(this.defaultBucket, 'us-east-1');
        console.log(`✅ Storage bucket '${this.defaultBucket}' created successfully`);
      } else {
        console.log(`✅ Storage bucket '${this.defaultBucket}' already exists`);
      }

      this.initialized = true;
      console.log('✅ Storage service initialized successfully');
    } catch (error) {
      console.error('❌ Storage service initialization error:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Upload file ke storage
   */
  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{ fileName: string; url: string; size: number }> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;

      // Upload ke MinIO
      await this.client.putObject(
        this.defaultBucket,
        uniqueFileName,
        fileBuffer,
        fileBuffer.length,
        {
          'Content-Type': contentType,
          ...metadata,
        }
      );

      // Generate URL
      const url = await this.getFileUrl(uniqueFileName);

      return {
        fileName: uniqueFileName,
        url,
        size: fileBuffer.length,
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Upload dengan custom path (untuk organization)
   */
  async uploadFileToPath(
    path: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{ fileName: string; url: string; size: number; path: string }> {
    try {
      const timestamp = Date.now();
      const fullPath = `${path}/${timestamp}-${fileName}`;

      await this.client.putObject(
        this.defaultBucket,
        fullPath,
        fileBuffer,
        fileBuffer.length,
        {
          'Content-Type': contentType,
          ...metadata,
        }
      );

      const url = await this.getFileUrl(fullPath);

      return {
        fileName: `${timestamp}-${fileName}`,
        url,
        size: fileBuffer.length,
        path: fullPath,
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Get file URL (pre-signed untuk 7 hari)
   */
  async getFileUrl(fileName: string, expirySeconds = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const url = await this.client.presignedGetObject(
        this.defaultBucket,
        fileName,
        expirySeconds
      );
      return url;
    } catch (error) {
      console.error('Storage get URL error:', error);
      throw new Error('Failed to get file URL');
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(fileName: string): Promise<Minio.BucketItemStat> {
    try {
      return await this.client.statObject(this.defaultBucket, fileName);
    } catch (error) {
      console.error('Storage get file info error:', error);
      throw new Error('File not found in storage');
    }
  }

  /**
   * Download file
   */
  async downloadFile(fileName: string): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        this.client.getObject(this.defaultBucket, fileName, (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        });
      });
    } catch (error) {
      console.error('Storage download error:', error);
      throw new Error('Failed to download file from storage');
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.client.removeObject(this.defaultBucket, fileName);
    } catch (error) {
      console.error('Storage delete error:', error);
      throw new Error('Failed to delete file from storage');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(fileNames: string[]): Promise<void> {
    try {
      await this.client.removeObjects(this.defaultBucket, fileNames);
    } catch (error) {
      console.error('Storage delete multiple error:', error);
      throw new Error('Failed to delete files from storage');
    }
  }

  /**
   * List files dalam bucket
   */
  async listFiles(prefix = '', recursive = true): Promise<Minio.BucketItem[]> {
    try {
      return new Promise((resolve, reject) => {
        const files: Minio.BucketItem[] = [];
        const stream = this.client.listObjects(this.defaultBucket, prefix, recursive);

        stream.on('data', (obj) => files.push(obj));
        stream.on('end', () => resolve(files));
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Storage list files error:', error);
      throw new Error('Failed to list files from storage');
    }
  }

  /**
   * Copy file
   */
  async copyFile(sourceFileName: string, destFileName: string): Promise<void> {
    try {
      const conds = new Minio.CopyConditions();
      await this.client.copyObject(
        this.defaultBucket,
        destFileName,
        `/${this.defaultBucket}/${sourceFileName}`,
        conds
      );
    } catch (error) {
      console.error('Storage copy error:', error);
      throw new Error('Failed to copy file in storage');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      await this.client.statObject(this.defaultBucket, fileName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get public URL (jika bucket public)
   */
  getPublicUrl(fileName: string): string {
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';

    return `${protocol}://${endpoint}:${port}/${this.defaultBucket}/${fileName}`;
  }

  /**
   * Upload avatar/profile picture
   */
  async uploadAvatar(
    userId: string,
    fileBuffer: Buffer,
    contentType: string,
    originalName: string
  ): Promise<{ fileName: string; url: string; size: number }> {
    const extension = originalName.split('.').pop() || 'jpg';
    const fileName = `${userId}.${extension}`;

    return this.uploadFileToPath('avatars', fileName, fileBuffer, contentType, {
      userId,
      type: 'avatar',
      originalName,
    });
  }

  /**
   * Upload document
   */
  async uploadDocument(
    userId: string,
    fileBuffer: Buffer,
    contentType: string,
    originalName: string
  ): Promise<{ fileName: string; url: string; size: number }> {
    return this.uploadFileToPath('documents', originalName, fileBuffer, contentType, {
      userId,
      type: 'document',
      originalName,
    });
  }

  /**
   * Upload image
   */
  async uploadImage(
    userId: string,
    fileBuffer: Buffer,
    contentType: string,
    originalName: string
  ): Promise<{ fileName: string; url: string; size: number }> {
    return this.uploadFileToPath('images', originalName, fileBuffer, contentType, {
      userId,
      type: 'image',
      originalName,
    });
  }

  /**
   * Get bucket statistics
   */
  async getBucketStats(): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    try {
      const files = await this.listFiles('', true);
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      return {
        totalFiles: files.length,
        totalSize,
      };
    } catch (error) {
      console.error('Storage stats error:', error);
      throw new Error('Failed to get storage statistics');
    }
  }

  /**
   * Clean up old files (older than N days)
   */
  async cleanupOldFiles(days: number): Promise<number> {
    try {
      const files = await this.listFiles('', true);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const filesToDelete = files.filter((file) => {
        return file.lastModified < cutoffDate;
      });

      if (filesToDelete.length > 0) {
        const fileNames = filesToDelete.map((f) => f.name);
        await this.deleteFiles(fileNames);
      }

      return filesToDelete.length;
    } catch (error) {
      console.error('Storage cleanup error:', error);
      throw new Error('Failed to cleanup old files');
    }
  }

  /**
   * Get user files
   */
  async getUserFiles(userId: string, prefix = ''): Promise<Minio.BucketItem[]> {
    try {
      const allFiles = await this.listFiles(prefix, true);

      // Filter by userId in metadata (would need to fetch metadata for each file)
      // For now, return all files with the prefix
      // In production, you'd want to store file ownership in a database

      return allFiles;
    } catch (error) {
      console.error('Storage get user files error:', error);
      throw new Error('Failed to get user files');
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export class for testing purposes
export { StorageService };

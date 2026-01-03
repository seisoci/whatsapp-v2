import * as Minio from 'minio';

/**
 * MinIO Client Configuration
 * S3-compatible object storage untuk file uploads
 */
export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Default bucket name
export const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'uploads';

/**
 * Initialize MinIO - create bucket if not exists
 */
export const initializeMinio = async (): Promise<void> => {
  try {
    const bucketExists = await minioClient.bucketExists(DEFAULT_BUCKET);

    if (!bucketExists) {
      await minioClient.makeBucket(DEFAULT_BUCKET, 'us-east-1');
      console.log(`✅ MinIO bucket '${DEFAULT_BUCKET}' created successfully`);

      // Set bucket policy untuk public read (opsional)
      // Uncomment jika ingin files bisa diakses public
      /*
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${DEFAULT_BUCKET}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(DEFAULT_BUCKET, JSON.stringify(policy));
      */
    } else {
      console.log(`✅ MinIO bucket '${DEFAULT_BUCKET}' already exists`);
    }

    console.log('✅ MinIO initialized successfully');
  } catch (error) {
    console.error('❌ MinIO initialization error:', error);
    throw error;
  }
};

/**
 * MinIO Service untuk file operations
 */
export class MinioService {
  /**
   * Upload file ke MinIO
   */
  static async uploadFile(
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
      await minioClient.putObject(DEFAULT_BUCKET, uniqueFileName, fileBuffer, fileBuffer.length, {
        'Content-Type': contentType,
        ...metadata,
      });

      // Generate URL (pre-signed URL atau public URL)
      const url = await this.getFileUrl(uniqueFileName);

      return {
        fileName: uniqueFileName,
        url,
        size: fileBuffer.length,
      };
    } catch (error) {
      console.error('MinIO upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Get file URL (pre-signed untuk 7 hari)
   */
  static async getFileUrl(fileName: string, expirySeconds = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const url = await minioClient.presignedGetObject(DEFAULT_BUCKET, fileName, expirySeconds);
      return url;
    } catch (error) {
      console.error('MinIO get URL error:', error);
      throw new Error('Failed to get file URL');
    }
  }

  /**
   * Get file metadata
   */
  static async getFileInfo(fileName: string): Promise<Minio.BucketItemStat> {
    try {
      return await minioClient.statObject(DEFAULT_BUCKET, fileName);
    } catch (error) {
      console.error('MinIO get file info error:', error);
      throw new Error('File not found');
    }
  }

  /**
   * Download file
   */
  static async downloadFile(fileName: string): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        minioClient.getObject(DEFAULT_BUCKET, fileName, (err, stream) => {
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
      console.error('MinIO download error:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(fileName: string): Promise<void> {
    try {
      await minioClient.removeObject(DEFAULT_BUCKET, fileName);
    } catch (error) {
      console.error('MinIO delete error:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Delete multiple files
   */
  static async deleteFiles(fileNames: string[]): Promise<void> {
    try {
      await minioClient.removeObjects(DEFAULT_BUCKET, fileNames);
    } catch (error) {
      console.error('MinIO delete multiple error:', error);
      throw new Error('Failed to delete files');
    }
  }

  /**
   * List files dalam bucket
   */
  static async listFiles(prefix = '', recursive = true): Promise<Minio.BucketItem[]> {
    try {
      return new Promise((resolve, reject) => {
        const files: Minio.BucketItem[] = [];
        const stream = minioClient.listObjects(DEFAULT_BUCKET, prefix, recursive);

        stream.on('data', (obj) => files.push(obj));
        stream.on('end', () => resolve(files));
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('MinIO list files error:', error);
      throw new Error('Failed to list files');
    }
  }

  /**
   * Copy file
   */
  static async copyFile(sourceFileName: string, destFileName: string): Promise<void> {
    try {
      const conds = new Minio.CopyConditions();
      await minioClient.copyObject(
        DEFAULT_BUCKET,
        destFileName,
        `/${DEFAULT_BUCKET}/${sourceFileName}`,
        conds
      );
    } catch (error) {
      console.error('MinIO copy error:', error);
      throw new Error('Failed to copy file');
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(fileName: string): Promise<boolean> {
    try {
      await minioClient.statObject(DEFAULT_BUCKET, fileName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get public URL (jika bucket public)
   */
  static getPublicUrl(fileName: string): string {
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';

    return `${protocol}://${endpoint}:${port}/${DEFAULT_BUCKET}/${fileName}`;
  }
}

export default minioClient;

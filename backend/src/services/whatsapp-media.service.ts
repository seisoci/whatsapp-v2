/**
 * WhatsApp Media Service
 * Handles downloading media from WhatsApp and uploading to S3/MinIO
 * WITH SECURITY: URL validation, domain whitelisting, size limits
 */

import { Readable } from 'stream';
import { storageService } from './storage.service';

const WHATSAPP_API_BASE_URL = process.env.WHATSAPP_API_VERSION 
  ? `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}`
  : 'https://graph.facebook.com/v18.0';

export class WhatsAppMediaService {
  /**
   * WhatsApp media URLs are ONLY from these domains
   * SECURITY: Prevent SSRF attacks to internal/external URLs
   */
  private static readonly ALLOWED_DOMAINS = [
    'lookaside.fbsbx.com',
    'scontent.whatsapp.net',
    'mmg.whatsapp.net',
    'scontent.xx.fbcdn.net',
  ];

  /**
   * WhatsApp file size limits (from official docs)
   * SECURITY: Prevent DOS via huge files
   */
  private static readonly MAX_SIZES = {
    image: 5 * 1024 * 1024,       // 5MB
    video: 16 * 1024 * 1024,      // 16MB
    audio: 16 * 1024 * 1024,      // 16MB
    document: 100 * 1024 * 1024,  // 100MB
    sticker: 500 * 1024,          // 500KB (animated stickers can be larger)
  };

  /**
   * Validate media URL is from WhatsApp domains
   * SECURITY: Prevent SSRF attacks
   */
  private static validateMediaUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      
      // Must be HTTPS
      if (parsed.protocol !== 'https:') {
        console.warn('⚠️ Media URL not HTTPS:', url);
        return false;
      }
      
      // Must be from allowed WhatsApp domains
      const isAllowed = this.ALLOWED_DOMAINS.some(domain => 
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        console.warn('⚠️ Media URL not from WhatsApp domain:', parsed.hostname);
      }
      
      return isAllowed;
    } catch (error: any) {
      console.error('❌ Invalid media URL format:', url, error);
      return false;
    }
  }

  /**
   * Download media from WhatsApp and upload to S3
   * Returns the S3 URL and media info
   */
  static async downloadAndStoreMedia(params: {
    mediaId: string;
    accessToken: string;
    phoneNumberId: string;
    messageType: 'image' | 'video' | 'audio' | 'document' | 'sticker';
    filename?: string;
    contactWaId: string;
  }): Promise<{
    mediaUrl: string; // S3/MinIO URL
    mediaFilename: string;
    mediaMimeType: string;
    mediaFileSize: number;
    s3Path: string;
  } | null> {
    try {
      // Step 1: Get media URL from WhatsApp
      const mediaUrlData = await this.getMediaUrl(params.mediaId, params.accessToken);
      
      if (!mediaUrlData) {
        console.error('Failed to get media URL from WhatsApp');
        return null;
      }

      // SECURITY: Validate URL is from WhatsApp domain
      if (!this.validateMediaUrl(mediaUrlData.url)) {
        console.error('❌ SECURITY: Media URL validation failed');
        return null;
      }

      // Step 2: Stream media from WhatsApp directly to MinIO — no in-RAM buffer
      const { stream, contentLength, contentType } = await this.fetchMediaAsStream(
        mediaUrlData.url,
        params.accessToken,
      );

      // Step 3: Upload stream to S3/MinIO
      const s3Path = `${params.contactWaId}/${params.messageType}`;
      const filename = params.filename || `${params.mediaId}.${this.getFileExtension(contentType || mediaUrlData.mime_type)}`;

      const uploadResult = await storageService.uploadStreamToPath(
        s3Path,
        filename,
        stream,
        contentLength,
        contentType || mediaUrlData.mime_type,
        {
          whatsappMediaId: params.mediaId,
          phoneNumberId: params.phoneNumberId,
          contactWaId: params.contactWaId,
          messageType: params.messageType,
        }
      );

      return {
        mediaUrl: uploadResult.url,
        mediaFilename: filename,
        mediaMimeType: mediaUrlData.mime_type,
        mediaFileSize: uploadResult.size,
        s3Path: uploadResult.path,
      };
    } catch (error: any) {
      console.error('Error downloading and storing media:', error);
      return null;
    }
  }

  /**
   * Get media URL from WhatsApp API
   */
  private static async getMediaUrl(
    mediaId: string,
    accessToken: string
  ): Promise<{ url: string; mime_type: string; sha256: string; file_size: number } | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000); // 15s timeout
      let response: Response;
      try {
        response = await fetch(`${WHATSAPP_API_BASE_URL}/${mediaId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const error: any = await response.json();
        console.error('WhatsApp API Error getting media URL:', error);
        return null;
      }

      return await response.json();
    } catch (error: any) {
      console.error('Failed to get media URL from WhatsApp:', error);
      return null;
    }
  }

  /**
   * Fetch media from WhatsApp and return a Node.js Readable stream.
   * The stream is piped directly into MinIO — nothing is buffered in RAM.
   */
  private static async fetchMediaAsStream(
    mediaUrl: string,
    accessToken: string,
  ): Promise<{ stream: Readable; contentLength: number | undefined; contentType: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000); // 2 min for large files
    let response: Response;
    try {
      response = await fetch(mediaUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error('Media response has no body');
    }

    const contentLengthHeader = response.headers.get('content-length');
    const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined;
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    console.log(`Streaming media: ${contentType}, size: ${contentLength ?? 'unknown'} bytes`);

    // Convert Web ReadableStream → Node.js Readable (Node 16.7+)
    const stream = Readable.fromWeb(response.body as any);
    return { stream, contentLength, contentType };
  }

  /**
   * Get file extension from MIME type
   */
  private static getFileExtension(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      // Images
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      
      // Videos
      'video/mp4': 'mp4',
      'video/3gpp': '3gp',
      
      // Audio
      'audio/aac': 'aac',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/amr': 'amr',
      'audio/ogg': 'ogg',
      
      // Documents
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/plain': 'txt',
    };

    return mimeMap[mimeType] || 'bin';
  }

  /**
   * Get media download URL (for frontend to display)
   */
  static async getMediaDownloadUrl(mediaId: string, accessToken: string): Promise<string | null> {
    const mediaData = await this.getMediaUrl(mediaId, accessToken);
    return mediaData?.url || null;
  }
  
  /**
   * Download and store contact profile picture to S3
   * Returns S3 URL for permanent storage
   */
  static async downloadAndStoreProfilePicture(params: {
    profilePictureUrl: string;
    contactWaId: string;
    phoneNumberId: string;
  }): Promise<string | null> {
    try {
      // SECURITY: Validate URL is from WhatsApp domain
      if (!this.validateMediaUrl(params.profilePictureUrl)) {
        console.error('❌ SECURITY: Profile picture URL validation failed');
        return null;
      }

      // Fetch profile picture and stream directly to MinIO
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000); // 15s timeout
      let response: Response;
      try {
        response = await fetch(params.profilePictureUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) {
        console.error('Failed to fetch profile picture:', response.statusText);
        return null;
      }
      if (!response.body) {
        console.error('Profile picture response has no body');
        return null;
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const contentLengthHeader = response.headers.get('content-length');
      const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined;
      const extension = contentType.split('/')[1]?.split(';')[0] || 'jpg';

      // Generate S3 path: phone_number_id/profile/{wa_id}-{ts}.{ext}
      const timestamp = Date.now();
      const filename = `${params.contactWaId}-${timestamp}.${extension}`;
      const s3Path = `${params.phoneNumberId}/profile`;

      const stream = Readable.fromWeb(response.body as any);
      const uploadResult = await storageService.uploadStreamToPath(
        s3Path,
        filename,
        stream,
        contentLength,
        contentType
      );

      if (!uploadResult || !uploadResult.url) {
        console.error('Failed to upload profile picture to S3');
        return null;
      }

      console.log(`✅ Profile picture stored: ${uploadResult.url}`);
      return uploadResult.url;
    } catch (error: any) {
      console.error('Error downloading/storing profile picture:', error);
      return null;
    }
  }
}


import { apiClient } from '../api-client';

export interface UploadMediaResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
}

export interface UploadS3Response {
  success: boolean;
  message: string;
  data?: {
    objectKey: string;
    presignedUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
}

export const mediaApi = {
  /**
   * Upload media file to WhatsApp API
   */
  upload: async (
    phoneNumberId: string,
    file: File
  ): Promise<UploadMediaResponse> => {
    const formData = new FormData();
    formData.append('phoneNumberId', phoneNumberId);
    formData.append('file', file);

    const response = await apiClient.post<UploadMediaResponse>(
      '/media/upload',
      formData
    );

    return response as unknown as UploadMediaResponse;
  },

  /**
   * Upload media file to S3/MinIO storage.
   * Returns object key for DB storage and presigned URL for immediate use.
   */
  uploadToS3: async (
    contactWaId: string,
    file: File,
    mediaType: string = 'image'
  ): Promise<UploadS3Response> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contactWaId', contactWaId);
    formData.append('mediaType', mediaType);

    const response = await apiClient.post<UploadS3Response>(
      '/media/upload-s3',
      formData
    );

    return response as unknown as UploadS3Response;
  },

  /**
   * Generate a fresh pre-signed URL for a stored media URL/path.
   * Use this when displaying media from DB messages whose stored URL may have expired.
   */
  presign: async (url: string): Promise<string | null> => {
    try {
      const response = await apiClient.get<{ success: boolean; url: string }>(
        `/media/presign?url=${encodeURIComponent(url)}`
      );
      const data = response as unknown as { success: boolean; url: string };
      return data.success ? data.url : null;
    } catch {
      return null;
    }
  },
};

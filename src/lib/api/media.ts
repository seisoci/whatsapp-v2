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

import { apiClient } from './client';

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
  upload: async (phoneNumberId: string, file: File): Promise<UploadMediaResponse> => {
    const formData = new FormData();
    formData.append('phoneNumberId', phoneNumberId);
    formData.append('file', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    return response.json();
  },
};

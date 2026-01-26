/**
 * Templates API Client
 * HTTP endpoints for WhatsApp message templates functionality
 */

import { apiClient, type ApiResponse } from '../api-client';

export const templatesApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse>('/templates', { params }),

  getById: (id: string, phoneNumberId: string) =>
    apiClient.get<ApiResponse>(`/templates/${id}`, { params: { phoneNumberId } }),

  create: (data: any, mediaFile?: File) => {
    // If media file is provided, send as multipart/form-data
    if (mediaFile) {
      const formData = new FormData();
      formData.append('phoneNumberId', data.phoneNumberId);
      formData.append('name', data.name);
      formData.append('language', data.language);
      formData.append('category', data.category);
      formData.append('components', JSON.stringify(data.components));
      formData.append('mediaFile', mediaFile);
      
      return apiClient.post<ApiResponse>('/templates', formData);
    }
    
    // Otherwise send as JSON
    return apiClient.post<ApiResponse>('/templates', data);
  },

  update: (id: string, data: any) => apiClient.put<ApiResponse>(`/templates/${id}`, data),

  delete: (id: string, phoneNumberId: string, templateName: string) =>
    apiClient.delete<ApiResponse>(`/templates/${id}`, {
      params: { phoneNumberId, templateName },
    }),
};

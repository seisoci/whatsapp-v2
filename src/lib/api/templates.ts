/**
 * Templates API Client
 * HTTP endpoints for WhatsApp message templates functionality
 */

import { apiClient, type ApiResponse } from '../api-client';

export const templatesApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse>('/templates', { params }),

  getById: (id: string, phoneNumberId: string) =>
    apiClient.get<ApiResponse>(`/templates/${id}`, { params: { phoneNumberId } }),

  create: (data: any) => apiClient.post<ApiResponse>('/templates', data),

  update: (id: string, data: any) => apiClient.put<ApiResponse>(`/templates/${id}`, data),

  delete: (id: string, phoneNumberId: string, templateName: string) =>
    apiClient.delete<ApiResponse>(`/templates/${id}`, {
      params: { phoneNumberId, templateName },
    }),
};

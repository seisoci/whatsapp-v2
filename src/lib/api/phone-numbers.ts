/**
 * Phone Numbers API Client
 * HTTP endpoints for WhatsApp phone numbers functionality
 */

import { apiClient, type ApiResponse } from '../api-client';

export const phoneNumbersApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse>('/phone-numbers', { params }),

  getById: (id: string) => apiClient.get<ApiResponse>(`/phone-numbers/${id}`),

  create: (data: {
    phoneNumberId: string;
    accessToken: string;
    wabaId: string;
    description?: string;
  }) => apiClient.post<ApiResponse>('/phone-numbers', data),

  update: (id: string, data: any) =>
    apiClient.put<ApiResponse>(`/phone-numbers/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/phone-numbers/${id}`),

  sync: (id: string) => apiClient.post<ApiResponse>(`/phone-numbers/${id}/sync`, {}),

  testConnection: (id: string) =>
    apiClient.post<ApiResponse>(`/phone-numbers/${id}/test-connection`, {}),

  // Verification endpoints
  requestVerificationCode: (id: string, data: { codeMethod?: 'SMS' | 'VOICE'; language?: string }) =>
    apiClient.post<ApiResponse>(`/phone-numbers/${id}/request-verification-code`, data),

  verifyCode: (id: string, data: { code: string }) =>
    apiClient.post<ApiResponse>(`/phone-numbers/${id}/verify-code`, data),

  setTwoStepVerification: (id: string, data: { pin: string }) =>
    apiClient.post<ApiResponse>(`/phone-numbers/${id}/set-two-step-verification`, data),

  getDisplayNameStatus: (id: string) =>
    apiClient.get<ApiResponse>(`/phone-numbers/${id}/display-name-status`),

  updateBusinessProfile: (id: string, data: {
    about?: string;
    address?: string;
    description?: string;
    email?: string;
    vertical?: string;
    websites?: string[];
  }) =>
    apiClient.put<ApiResponse>(`/phone-numbers/${id}/business-profile`, data),

  uploadProfilePicture: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse>(`/phone-numbers/${id}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteProfilePicture: (id: string) =>
    apiClient.delete<ApiResponse>(`/phone-numbers/${id}/profile-picture`),
};

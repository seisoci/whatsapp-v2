/**
 * Users API Client
 * HTTP endpoints for user management functionality
 */

import { apiClient, type ApiResponse } from '../api-client';

export const usersApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse>('/users', { params }),

  getById: (id: string) => apiClient.get<ApiResponse>(`/users/${id}`),

  create: (data: any) => apiClient.post<ApiResponse>('/users', data),

  update: (id: string, data: any) => apiClient.put<ApiResponse>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/users/${id}`),

  resetPassword: (id: string, newPassword: string) =>
    apiClient.post<ApiResponse>(`/users/${id}/reset-password`, { newPassword }),
};

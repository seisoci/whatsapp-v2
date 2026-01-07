/**
 * Permissions API Client
 * HTTP endpoints for permission management functionality
 */

import { apiClient, type ApiResponse } from '../api-client';

export const permissionsApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse>('/permissions', { params }),

  getGrouped: () => apiClient.get<ApiResponse>('/permissions/grouped'),

  getById: (id: string) => apiClient.get<ApiResponse>(`/permissions/${id}`),

  create: (data: any) => apiClient.post<ApiResponse>('/permissions', data),

  createCrud: (data: any) => apiClient.post<ApiResponse>('/permissions/crud', data),

  update: (id: string, data: any) => apiClient.put<ApiResponse>(`/permissions/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/permissions/${id}`),
};

/**
 * API Endpoints API Client
 * HTTP endpoints for managing external API endpoints
 */

import { apiClient, type ApiResponse } from '../api-client';

export interface ApiEndpoint {
  id: string;
  name: string;
  description: string | null;
  webhookUrl: string;
  apiKey: string | null;
  isActive: boolean;
  phoneNumberId: string | null;
  phoneNumberName: string | null;
  createdBy: string | null;
  creatorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiEndpointData {
  name: string;
  description?: string | null;
  webhookUrl: string;
  apiKey?: string | null;
  isActive?: boolean;
  phoneNumberId?: string | null;
}

export interface UpdateApiEndpointData {
  name?: string;
  description?: string | null;
  webhookUrl?: string;
  apiKey?: string | null;
  isActive?: boolean;
  phoneNumberId?: string | null;
}

export const apiEndpointsApi = {
  getAll: () => apiClient.get<ApiResponse<ApiEndpoint[]>>('/api-endpoints'),

  getById: (id: string) => apiClient.get<ApiResponse<ApiEndpoint>>(`/api-endpoints/${id}`),

  create: (data: CreateApiEndpointData) =>
    apiClient.post<ApiResponse<ApiEndpoint>>('/api-endpoints', data),

  update: (id: string, data: UpdateApiEndpointData) =>
    apiClient.put<ApiResponse<ApiEndpoint>>(`/api-endpoints/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/api-endpoints/${id}`),

  toggleStatus: (id: string) =>
    apiClient.patch<ApiResponse<{ id: string; name: string; isActive: boolean }>>(
      `/api-endpoints/${id}/toggle-status`,
      {}
    ),
};

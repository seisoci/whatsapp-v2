/**
 * Contacts API Client
 * HTTP endpoints for contact management functionality
 */

import { apiClient, type ApiResponse } from '../api-client';
import { CreateContactInput, UpdateContactInput } from './types/contacts';

export const contactsApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse>('/contacts', { params }),

  getById: (id: string) => apiClient.get<ApiResponse>(`/contacts/${id}`),

  create: (data: CreateContactInput) => apiClient.post<ApiResponse>('/contacts', data),

  update: (id: string, data: UpdateContactInput) => apiClient.put<ApiResponse>(`/contacts/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/contacts/${id}`),
};

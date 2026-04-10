/**
 * Template Role Access API Client
 * HTTP endpoints untuk manajemen akses role ke template WhatsApp
 */

import { apiClient, type ApiResponse } from '../api-client';

export const templateRolesApi = {
  getAll: () => apiClient.get<ApiResponse>('/template-roles'),

  getByTemplate: (templateId: string, phoneNumberDbId: string) =>
    apiClient.get<ApiResponse>(`/template-roles/${templateId}`, {
      params: { phoneNumberDbId },
    }),

  assign: (
    templateId: string,
    data: {
      phoneNumberDbId: string;
      wabaId: string;
      templateName: string;
      roleIds: string[];
    }
  ) => apiClient.put<ApiResponse>(`/template-roles/${templateId}`, data),

  removeAll: (templateId: string, phoneNumberDbId: string) =>
    apiClient.delete<ApiResponse>(`/template-roles/${templateId}`, {
      params: { phoneNumberDbId },
    }),
};

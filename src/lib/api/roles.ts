/**
 * Roles API Client
 * HTTP endpoints for role management functionality
 */

import { apiClient, type ApiResponse } from '../api-client';

export const rolesApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse>('/roles', { params }),

  getById: (id: string) => apiClient.get<ApiResponse>(`/roles/${id}`),

  create: (data: any) => apiClient.post<ApiResponse>('/roles', data),

  update: (id: string, data: any) => apiClient.put<ApiResponse>(`/roles/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse>(`/roles/${id}`),

  assignPermissions: (id: string, data: { permissionIds: string[] }) =>
    apiClient.put<ApiResponse>(`/roles/${id}/permissions`, data),

  assignMenus: (id: string, menuIds: string[]) =>
    apiClient.post<ApiResponse>(`/roles/${id}/menus`, { menuIds }),
};

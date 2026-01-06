import apiClient, { type ApiResponse } from '../api-client';

export interface QuickReply {
  id: string;
  userId: string;
  shortcut: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export const quickReplyApi = {
  getAll: () => apiClient.get<QuickReply[]>('/quick-replies'),
  
  create: (data: { shortcut: string; text: string }) => 
    apiClient.post<QuickReply>('/quick-replies', data),
  
  update: (id: string, data: { shortcut?: string; text?: string }) => 
    apiClient.put<QuickReply>(`/quick-replies/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/quick-replies/${id}`),
};

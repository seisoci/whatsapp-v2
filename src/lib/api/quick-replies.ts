/**
 * Quick Replies API Client
 * HTTP endpoints for quick replies functionality
 */

import { apiClient } from '../api-client';
import type { QuickReply } from '../types/quick-replies';

// Re-export type for backward compatibility
export type { QuickReply };

export const quickReplyApi = {
  getAll: () => apiClient.get<QuickReply[]>('/quick-replies').then(r => r.data),
  
  create: (data: { shortcut: string; text: string }) => 
    apiClient.post<QuickReply>('/quick-replies', data).then(r => r.data),
  
  update: (id: string, data: { shortcut?: string; text?: string }) => 
    apiClient.put<QuickReply>(`/quick-replies/${id}`, data).then(r => r.data),
  
  delete: (id: string) => 
    apiClient.delete(`/quick-replies/${id}`).then(r => r.data),
};

/**
 * Chat API Client
 * HTTP endpoints for chat functionality
 */

import { apiClient } from '../api-client';
import type { Contact, Message, SendMessageRequest, Tag } from '../types/chat';

// Re-export types for backward compatibility
export type { Contact, Message, SendMessageRequest, Tag };

/**
 * Chat API
 * Object-based API for chat-related operations
 */
export const chatApi = {
  getPhoneNumbers: () =>
    apiClient.get('/chat/phone-numbers').then(r => r.data),

  getContacts: (params: {
    phoneNumberId: string;
    search?: string;
    filter?: 'all' | 'unread' | 'archived';
    page?: number;
    limit?: number;
  }) => apiClient.get('/chat/contacts', { params }).then(r => r.data),

  getContactsStats: (phoneNumberId: string) =>
    apiClient.get('/chat/contacts/stats', { params: { phoneNumberId } }).then(r => r.data),

  getContact: (contactId: string) =>
    apiClient.get(`/chat/contacts/${contactId}`).then(r => r.data),

  markConversationAsRead: (contactId: string) =>
    apiClient.put(`/chat/contacts/${contactId}/read`).then(r => r.data),

  archiveContact: (contactId: string) =>
    apiClient.put(`/chat/contacts/${contactId}/archive`).then(r => r.data),

  unarchiveContact: (contactId: string) =>
    apiClient.put(`/chat/contacts/${contactId}/unarchive`).then(r => r.data),

  deleteContact: (contactId: string) =>
    apiClient.delete(`/chat/contacts/${contactId}`).then(r => r.data),

  // Message operations
  getMessages: (params: {
    contactId: string;
    page?: number;
    limit?: number;
  }) => apiClient.get('/chat/messages', { params }).then(r => r.data),

  sendMessage: (data: SendMessageRequest) =>
    apiClient.post('/chat/messages', data).then(r => r.data),

  markMessageAsRead: (messageId: string) =>
    apiClient.put(`/chat/messages/${messageId}/read`).then(r => r.data),

  // Tag operations
  getTags: () =>
    apiClient.get('/tags').then(r => r.data),

  createTag: (data: { name: string; color: string }) =>
    apiClient.post('/tags', data).then(r => r.data),

  addTagToContact: (contactId: string, tagId: string) =>
    apiClient.post(`/chat/contacts/${contactId}/tags`, { tagId }).then(r => r.data),

  removeTagFromContact: (contactId: string, tagId: string) =>
    apiClient.delete(`/chat/contacts/${contactId}/tags/${tagId}`).then(r => r.data),
};

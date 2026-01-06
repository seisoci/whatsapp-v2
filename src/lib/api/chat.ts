/**
 * Chat API Client
 * HTTP endpoints for chat functionality
 */

import { apiClient } from '../api-client';

export interface Contact {
  id: string;
  waId: string;
  phoneNumber: string;
  profileName: string | null;
  businessName: string | null;
  profilePictureUrl: string | null;
  isBusinessAccount: boolean;
  isBlocked: boolean;
  tags: Tag[];
  notes: string | null;
  sessionExpiresAt: string | null;
  isSessionActive: boolean;
  sessionRemainingSeconds: number;
  lastMessage: {
    id: string;
    messageType: string;
    textBody: string | null;
    mediaCaption: string | null;
    direction: string;
    timestamp: string;
    status: string;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  wamid: string;
  contactId: string;
  messageType: string;
  textBody: string | null;
  mediaUrl: string | null;
  mediaCaption: string | null;
  mediaFilename: string | null;
  mediaMimeType: string | null;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  status: string;
  readAt: string | null;
  reactionEmoji?: string | null;
  reactionMessageId?: string | null;
  // User info (for outgoing messages)
  userId?: string | null;
  user?: {
    id: string;
    username: string;
    email: string;
    isActive: boolean;
    emailVerified: boolean;
    roleId: string;
  } | null;
}

export interface SendMessageRequest {
  contactId: string;
  phoneNumberId: string;
  type: 'text' | 'template' | 'image' | 'video' | 'document' | 'audio';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language?: string;
    components?: any[];
  };
  media?: {
    mediaId?: string;
    mediaUrl?: string;
    caption?: string;
    filename?: string;
  };
}

/**
 * Get all contacts for a phone number
 */
export async function getChatContacts(params: {
  phoneNumberId: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get('/chat/contacts', {
    params,
  });
  return response.data;
}

/**
 * Get single contact details
 */
export async function getChatContact(contactId: string) {
  const response = await apiClient.get(`/chat/contacts/${contactId}`);
  return response.data;
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(contactId: string) {
  const response = await apiClient.put(`/chat/contacts/${contactId}/read`);
  return response.data;
}

/**
 * Delete contact
 */
export async function deleteChatContact(contactId: string) {
  const response = await apiClient.delete(`/chat/contacts/${contactId}`);
  return response.data;
}

/**
 * Get messages for a contact
 */
export async function getChatMessages(params: {
  contactId: string;
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get('/chat/messages', {
    params,
  });
  return response.data;
}

/**
 * Send a message
 */
export async function sendChatMessage(data: SendMessageRequest) {
  const response = await apiClient.post('/chat/messages', data);
  return response.data;
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string) {
  const response = await apiClient.put(`/chat/messages/${messageId}/read`);
  return response.data;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

/**
 * Get all tags
 */
export async function getTags() {
  const response = await apiClient.get('/tags');
  return response.data;
}

/**
 * Create a new tag
 */
export async function createTag(data: { name: string; color: string }) {
  const response = await apiClient.post('/tags', data);
  return response.data;
}

/**
 * Add tag to contact
 */
export async function addTagToContact(contactId: string, tagId: string) {
  const response = await apiClient.post(`/chat/contacts/${contactId}/tags`, { tagId });
  return response.data;
}

/**
 * Remove tag from contact
 */
export async function removeTagFromContact(contactId: string, tagId: string) {
  const response = await apiClient.delete(`/chat/contacts/${contactId}/tags/${tagId}`);
  return response.data;
}

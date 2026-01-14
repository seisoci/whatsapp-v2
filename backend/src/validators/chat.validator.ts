/**
 * Chat Validators
 * Input validation schemas for chat endpoints
 */

import { z } from 'zod';

/**
 * Get contacts query params
 */
export const getContactsSchema = z.object({
  phoneNumberId: z.string().uuid('Invalid phone number ID'),
  search: z.string().optional(),
  filter: z.enum(['all', 'unread', 'archived']).optional().default('all'),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
});

/**
 * Get messages query params
 */
export const getMessagesSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
});

/**
 * Send message request
 */
export const sendMessageSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  phoneNumberId: z.string().uuid('Invalid phone number ID'),
  type: z.enum(['text', 'template', 'image', 'video', 'document', 'audio']),
  
  // Text message
  text: z.object({
    body: z.string().min(1).max(4096),
  }).optional(),
  
  // Template message
  template: z.object({
    name: z.string(),
    language: z.string().default('en'),
    components: z.array(z.any()).optional(),
  }).optional(),
  
  // Media message
  media: z.object({
    mediaId: z.string().optional(),
    mediaUrl: z.string().url().optional(),
    caption: z.string().optional(),
    filename: z.string().optional(),
  }).optional(),
});

/**
 * Mark as read request
 */
export const markAsReadSchema = z.object({
  messageIds: z.array(z.string().uuid()).min(1).max(100),
});

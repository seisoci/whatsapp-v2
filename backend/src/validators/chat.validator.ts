/**
 * Chat Validators
 * Input validation schemas for chat endpoints
 */

import { z } from 'zod';

const contactTypeSchema = z.enum(['HOME', 'WORK']);

const contactTypedFieldSchema = z.object({
  type: contactTypeSchema.optional(),
});

const contactAddressSchema = contactTypedFieldSchema.extend({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
});

const contactEmailSchema = contactTypedFieldSchema.extend({
  email: z.string().email(),
});

const contactPhoneSchema = contactTypedFieldSchema.extend({
  phone: z.string().min(1),
  wa_id: z.string().optional(),
});

const contactUrlSchema = contactTypedFieldSchema.extend({
  url: z.string().url(),
});

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
  type: z.enum(['text', 'template', 'image', 'video', 'document', 'audio', 'contacts']),

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

  // Contacts message
  contacts: z.array(z.object({
    addresses: z.array(contactAddressSchema).optional(),
    birthday: z.string().optional(),
    name: z.object({
      formatted_name: z.string().min(1),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      middle_name: z.string().optional(),
      suffix: z.string().optional(),
      prefix: z.string().optional(),
    }),
    phones: z.array(contactPhoneSchema).min(1),
    emails: z.array(contactEmailSchema).optional(),
    org: z.object({
      company: z.string().optional(),
      department: z.string().optional(),
      title: z.string().optional(),
    }).optional(),
    urls: z.array(contactUrlSchema).optional(),
  })).optional(),
});

/**
 * Mark as read request
 */
export const markAsReadSchema = z.object({
  messageIds: z.array(z.string().uuid()).min(1).max(100),
});

/**
 * Webhook Payload Validators
 * Validates incoming WhatsApp webhook payloads for security
 */

import { z } from 'zod';

/**
 * WhatsApp message type enum
 */
const messageTypeSchema = z.enum([
  'text',
  'image',
  'video',
  'audio',
  'document',
  'sticker',
  'location',
  'contacts',
  'interactive',
  'template',
  'reaction',
  'button',
  'order',
  'system',
  'unsupported',
]);

/**
 * Message object schema
 */
const messageSchema = z.object({
  from: z.string().max(20),
  id: z.string().max(255),
  timestamp: z.string(),
  type: messageTypeSchema,
  // Type-specific fields (all optional)
  text: z.object({ body: z.string().max(5000) }).optional(),
  image: z.any().optional(),
  video: z.any().optional(),
  audio: z.any().optional(),
  document: z.any().optional(),
  sticker: z.any().optional(),
  location: z.any().optional(),
  contacts: z.any().optional(),
  interactive: z.any().optional(),
  reaction: z.any().optional(),
  button: z.any().optional(),
  order: z.any().optional(),
  system: z.any().optional(),
  context: z.any().optional(),
  identity: z.any().optional(),
  errors: z.array(z.any()).optional(),
});

/**
 * Status update schema
 */
const statusSchema = z.object({
  id: z.string().max(255),
  status: z.enum(['sent', 'delivered', 'read', 'failed', 'deleted']),
  timestamp: z.string(),
  recipient_id: z.string().max(20),
  conversation: z.any().optional(),
  pricing: z.any().optional(),
  errors: z.array(z.any()).optional(),
});

/**
 * Metadata schema
 */
const metadataSchema = z.object({
  display_phone_number: z.string().max(20),
  phone_number_id: z.string().max(50),
});

/**
 * Value object schema
 */
const valueSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  metadata: metadataSchema,
  contacts: z.array(z.any()).max(10).optional(),
  messages: z.array(messageSchema).max(10).optional(), // Max 10 messages per webhook
  statuses: z.array(statusSchema).max(10).optional(), // Max 10 statuses per webhook
  errors: z.array(z.any()).optional(),
});

/**
 * Change object schema
 */
const changeSchema = z.object({
  value: valueSchema,
  field: z.string().max(50),
});

/**
 * Entry object schema
 */
const entrySchema = z.object({
  id: z.string().max(50),
  changes: z.array(changeSchema).max(5), // Max 5 changes per entry
});

/**
 * Main webhook payload schema
 */
export const webhookPayloadSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(entrySchema).max(5), // Max 5 entries per webhook
});

/**
 * Validate webhook payload
 */
export function validateWebhookPayload(payload: unknown): {
  success: boolean;
  data?: z.infer<typeof webhookPayloadSchema>;
  error?: string;
} {
  try {
    const result = webhookPayloadSchema.safeParse(payload);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown validation error',
    };
  }
}

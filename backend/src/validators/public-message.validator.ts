import { z } from 'zod';

/**
 * Public Message Validators
 * Validation schemas untuk public API endpoints (send-message-template, dll)
 */

export const sendTemplateSchema = z.object({
  phone_number: z.string().min(10, 'Phone number required'),
  template_name: z.string().min(1, 'Template name required'),
  template: z.array(z.any()).optional().default([]),
});

export type SendTemplateInput = z.infer<typeof sendTemplateSchema>;

import { z } from 'zod';
import { messages } from '@/config/messages';

export const createTemplateSchema = z.object({
  name: z.string().min(1, { message: messages.templateNameIsRequired }),
  folder: z
    .string({
      message: messages.templateDirIsRequired,
    })
    .min(1, { message: messages.templateDirIsRequired }),
  snippet: z.string().optional(),
  template: z.string().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

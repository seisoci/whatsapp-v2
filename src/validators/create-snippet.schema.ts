import { z } from 'zod';
import { messages } from '@/config/messages';

export const createSnippetSchema = z.object({
  name: z.string().min(1, { message: messages.snippetNameIsRequired }),
  folder: z
    .string({
      message: messages.snippetDirIsRequired,
    })
    .min(1, { message: messages.snippetDirIsRequired }),
  snippet: z.string().optional(),
  template: z.string().optional(),
});

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;

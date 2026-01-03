import { z } from 'zod';
import { messages } from '@/config/messages';

export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, { message: messages.folderNameIsRequired })
    .min(3, { message: messages.folderNameLengthMin }),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;

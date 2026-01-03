import { z } from 'zod';
import { messages } from '@/config/messages';

export const createRoleSchema = z.object({
  roleName: z
    .string()
    .min(1, { message: messages.roleNameIsRequired })
    .min(3, { message: messages.roleNameLengthMin }),
  roleColor: z
    .object({
      r: z.number(),
      g: z.number(),
      b: z.number(),
      a: z.number(),
    })
    .optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

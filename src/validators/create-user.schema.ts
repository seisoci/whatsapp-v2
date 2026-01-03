import { z } from 'zod';
import { messages } from '@/config/messages';
import { validateEmail } from './common-rules';

export const createUserSchema = z.object({
  fullName: z.string().min(1, { message: messages.fullNameIsRequired }),
  email: validateEmail,
  role: z.string().min(1, { message: messages.roleIsRequired }),
  permissions: z.string().min(1, { message: messages.permissionIsRequired }),
  status: z.string().min(1, { message: messages.statusIsRequired }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

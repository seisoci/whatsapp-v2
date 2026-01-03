import { z } from 'zod';
import { messages } from '@/config/messages';
import {
  validatePassword,
  validateNewPassword,
  validateConfirmPassword,
} from './common-rules';

export const passwordFormSchema = z
  .object({
    currentPassword: validatePassword,
    newPassword: validateNewPassword,
    confirmedPassword: validateConfirmPassword,
  })
  .refine((data) => data.newPassword === data.confirmedPassword, {
    message: messages.passwordsDidNotMatch,
    path: ['confirmedPassword'],
  });

export type PasswordFormTypes = z.infer<typeof passwordFormSchema>;

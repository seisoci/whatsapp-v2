import { z } from 'zod';
import { messages } from '@/config/messages';
import { validateEmail } from './common-rules';

// Schema for creating user (password required)
export const createUserSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: validateEmail,
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  password_confirmation: z.string().min(8, { message: 'Password confirmation must be at least 8 characters' }),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

// Schema for updating user (password optional)
export const updateUserSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: validateEmail,
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }).optional().or(z.literal('')),
  password_confirmation: z.string().optional().or(z.literal('')),
}).refine((data) => {
  // If password is provided, confirmation must match
  if (data.password && data.password.length > 0) {
    return data.password === data.password_confirmation;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

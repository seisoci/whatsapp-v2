import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
  turnstileToken: z.string().min(1, 'Please complete the CAPTCHA verification'),
});

export type LoginSchema = z.infer<typeof loginSchema>;

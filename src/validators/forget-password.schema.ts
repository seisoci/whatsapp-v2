import { z } from 'zod';
import { validateEmail } from './common-rules';

export const forgetPasswordSchema = z.object({
  email: validateEmail,
});

export type ForgetPasswordSchema = z.infer<typeof forgetPasswordSchema>;

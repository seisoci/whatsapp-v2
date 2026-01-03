import { z } from 'zod';
import { validateEmail } from './common-rules';

export const newsLetterFormSchema = z.object({
  email: validateEmail,
});

export type NewsLetterFormSchema = z.infer<typeof newsLetterFormSchema>;

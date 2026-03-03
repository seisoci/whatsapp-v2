import { z } from 'zod';
import { messages } from '@/config/messages';

export const productDetailsSchema = z.object({
  productSize: z.coerce.number({
    message: messages.productSizeRequired,
  }),
  productColor: z.object({
    name: z.string(),
    code: z.string(),
  }),
});

export type ProductDetailsInput = z.infer<typeof productDetailsSchema>;

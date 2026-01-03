import { z } from 'zod';
import { messages } from '@/config/messages';

export const invoiceFormSchema = z.object({
  fromName: z.string().min(1, { message: messages.nameIsRequired }),
  fromAddress: z.string().min(1, { message: messages.addressIsRequired }),
  fromPhone: z.string().optional(),
  toName: z.string().min(1, { message: messages.nameIsRequired }),
  toAddress: z.string().min(1, { message: messages.addressIsRequired }),
  toPhone: z.string().optional(),
  invoiceNumber: z.string({
    message: 'This field is required',
  }),
  createDate: z.date({
    message: messages.createDateIsRequired,
  }),
  dueDate: z.date({
    message: messages.dueDateIsRequired,
  }),
  status: z.string({
    message: messages.statusIsRequired,
  }),
  shipping: z.coerce
    .number()
    .min(1, { message: messages.shippingPriceIsRequired }),
  discount: z.coerce.number().min(1, { message: messages.discountIsRequired }),
  taxes: z.coerce.number().min(1, { message: messages.taxIsRequired }),
  items: z.array(
    z.object({
      item: z.string().min(1, { message: messages.itemNameIsRequired }),
      description: z.string().min(1, { message: messages.itemDescIsRequired }),
      quantity: z.coerce
        .number()
        .min(1, { message: messages.itemQtyIsRequired }),
      price: z.coerce
        .number()
        .min(1, { message: messages.itemPriceIsRequired }),
    })
  ),
});

export type InvoiceFormInput = z.infer<typeof invoiceFormSchema>;

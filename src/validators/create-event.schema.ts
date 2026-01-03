import { z } from 'zod';
import { messages } from '@/config/messages';

export const eventFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: messages.nameIsRequired }),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.date({
    message: messages.startDateIsRequired,
  }),
  endDate: z.date({
    message: messages.endDateIsRequired,
  }),
});

export type EventFormInput = z.infer<typeof eventFormSchema>;

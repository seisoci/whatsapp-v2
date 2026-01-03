import { z } from 'zod';

export const findFlightSchema = z.object({
  fromName: z.string(),
  toName: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  selected: z.object({
    adults: z.number(),
    child: z.number(),
    infants: z.number(),
    cabin: z.string(),
  }),
});

export type FindFlightType = z.infer<typeof findFlightSchema>;

import { z } from 'zod';
import { messages } from '@/config/messages';
import { validateEmail } from './common-rules';

export const addTeamMemberSchema = z.object({
  first_name: z.string().min(1, { message: messages.firstNameRequired }),
  last_name: z.string().optional(),
  email: validateEmail,
  role: z.string({ message: messages.roleIsRequired }),
  country: z.string().optional(),
  teams: z.string({ message: messages.teamIsRequired }),
});

export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;

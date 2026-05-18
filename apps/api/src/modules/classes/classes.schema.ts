import { z } from 'zod';
export const createClassSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  join_code: z.string().min(4)
});

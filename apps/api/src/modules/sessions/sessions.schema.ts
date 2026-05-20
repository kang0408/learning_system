import { z } from 'zod';

export const startSessionSchema = z.object({
  assignment_id: z.string().uuid()
});

export const submitAnswerSchema = z.object({
  question_id: z.string().uuid(),
  selected_option_id: z.string().uuid().nullable().optional(),
  fill_text: z.string().optional(),
  response_time_ms: z.number().int().min(0)
});

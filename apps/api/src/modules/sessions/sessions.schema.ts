import { z } from 'zod';

export const startSessionSchema = z.object({
  assignment_id: z.string().uuid()
});

export const submitAnswerSchema = z.object({
  question_id: z.string().uuid(),
  selected_option_id: z.string().uuid().nullable().optional(), // Keeps backward compatibility
  selected_option_ids: z.array(z.string().uuid()).optional(),
  fill_text: z.string().optional(),
  matching_pairs: z.array(z.object({
    leftId: z.string(),
    rightId: z.string()
  })).optional(),
  response_time_ms: z.number().int().min(0)
});

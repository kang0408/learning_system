import { z } from 'zod';

export const createAssignmentSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  mode: z.enum(['adaptive', 'fixed']).default('adaptive'),
  deadline: z.string().datetime().optional().nullable(),
  max_attempts: z.number().int().min(0).default(0),
  time_limit: z.number().int().min(0).optional().nullable(),
  question_ids: z.array(z.string().uuid()).min(1, 'Phải có ít nhất 1 câu hỏi')
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  mode: z.enum(['adaptive', 'fixed']).optional(),
  deadline: z.string().datetime().optional().nullable(),
  max_attempts: z.number().int().min(0).optional(),
  time_limit: z.number().int().min(0).optional().nullable(),
  question_ids: z.array(z.string().uuid()).optional()
});

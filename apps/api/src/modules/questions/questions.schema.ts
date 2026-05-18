import { z } from 'zod';

export const answerOptionSchema = z.object({
  content: z.string().min(1),
  is_correct: z.boolean(),
  order_index: z.number().int()
});

export const createQuestionSchema = z.object({
  content: z.string().min(1, 'Nội dung câu hỏi là bắt buộc'),
  question_type: z.enum(['multiple_choice', 'true_false', 'fill_blank', 'matching']),
  topic: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).default(3),
  explanation: z.string().optional(),
  answer_options: z.array(answerOptionSchema).optional()
});

export const updateQuestionSchema = createQuestionSchema;

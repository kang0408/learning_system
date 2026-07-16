import { z } from 'zod';

export const answerOptionSchema = z.object({
  content: z.string().min(1),
  is_correct: z.boolean(),
  order_index: z.number().int()
});

export const createQuestionSchema = z.object({
  content: z.string().min(1, 'Nội dung câu hỏi là bắt buộc'),
  question_type: z.enum(['multiple_choice', 'true_false']),
  difficulty: z.number().int().min(1).max(5).default(3),
  explanation: z.string().optional(),
  topic_id: z.string().uuid().optional().nullable(),
  is_public: z.boolean().optional().default(false),
  answer_options: z.array(answerOptionSchema).optional()
});

export const updateQuestionSchema = createQuestionSchema;

export const createTopicSchema = z.object({
  name: z.string().min(1, 'Tiêu đề là bắt buộc'),
  description: z.string().optional(),
  code: z.string().length(6, 'Mã topic phải chứa đúng 6 ký tự').optional()
});

export const updateTopicSchema = createTopicSchema;

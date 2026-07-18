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

export const generateAiQuestionsSchema = z.object({
  topic: z.string().min(2, 'Chủ đề phải có ít nhất 2 ký tự'),
  question_type: z.enum(['multiple_choice', 'true_false', 'mixed']),
  quantity: z.number().int().min(1).max(20).default(10),
  difficulty: z.number().int().min(1).max(5).optional(),
});

export const bulkCreateQuestionsSchema = z.object({
  topic_id: z.string().uuid(),
  questions: z.array(z.object({
    content: z.string().min(1),
    question_type: z.enum(['multiple_choice', 'true_false']),
    difficulty: z.number().int().min(1).max(5).default(3),
    explanation: z.string().optional(),
    answer_options: z.array(z.object({
      content: z.string().min(1),
      is_correct: z.boolean()
    })).min(2).max(4)
  }))
});

export const aiGeneratedQuestionResponseSchema = z.array(z.object({
  content: z.string(),
  question_type: z.enum(['multiple_choice', 'true_false']),
  difficulty: z.number().int().min(1).max(5),
  explanation: z.string(),
  answer_options: z.array(z.object({
    content: z.string(),
    is_correct: z.boolean()
  }))
}));

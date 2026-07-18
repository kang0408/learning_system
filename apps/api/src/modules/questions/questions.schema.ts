import { z } from 'zod';

export const answerOptionSchema = z.object({
  content: z.string().min(1),
  is_correct: z.boolean(),
  order_index: z.number().int().optional()
});

const baseQuestionProps = {
  difficulty: z.number().int().min(1).max(5).default(3),
  explanation: z.string().optional(),
  topic_id: z.string().uuid().optional().nullable(),
  is_public: z.boolean().optional().default(false),
};

export const createQuestionSchema = z.discriminatedUnion('question_type', [
  z.object({
    ...baseQuestionProps,
    question_type: z.enum(['multiple_choice', 'true_false', 'multi_select']),
    content: z.string().min(1, 'Nội dung câu hỏi là bắt buộc'),
    answer_options: z.array(answerOptionSchema).optional()
  }),
  z.object({
    ...baseQuestionProps,
    question_type: z.literal('fill_blank'),
    content: z.string().min(1, 'Nội dung câu hỏi là bắt buộc'),
    answer_options: z.array(answerOptionSchema).min(1, 'Cần ít nhất một lựa chọn trả lời đúng')
  }),
  z.object({
    ...baseQuestionProps,
    question_type: z.literal('matching'),
    content: z.string().min(1, 'Nội dung câu hỏi là bắt buộc'),
    metadata: z.object({
      pairs: z.array(z.object({
        leftId: z.string().optional(),
        leftText: z.string(),
        rightId: z.string().optional(),
        rightText: z.string()
      }))
    }).optional()
  })
]);

export const updateQuestionSchema = createQuestionSchema;

export const generateAiQuestionsSchema = z.object({
  topic: z.string().min(2, 'Chủ đề phải có ít nhất 2 ký tự'),
  question_type: z.enum(['multiple_choice', 'multi_select', 'true_false', 'fill_blank', 'matching', 'mixed']),
  quantity: z.number().int().min(1).max(20).default(10),
  difficulty: z.number().int().min(1).max(5).optional(),
});

export const bulkCreateQuestionsSchema = z.object({
  topic_id: z.string().uuid(),
  questions: z.array(createQuestionSchema)
});

export const aiGeneratedQuestionResponseSchema = z.array(z.object({
  content: z.string(),
  question_type: z.enum(['multiple_choice', 'multi_select', 'true_false', 'fill_blank', 'matching']),
  difficulty: z.number().int().min(1).max(5),
  explanation: z.string(),
  answer_options: z.array(z.object({
    content: z.string(),
    is_correct: z.boolean()
  })).optional(),
  metadata: z.any().optional()
}));

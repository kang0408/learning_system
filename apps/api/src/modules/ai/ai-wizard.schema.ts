import { z } from 'zod';

export const questionTypeEnum = z.enum([
  'multiple_choice',
  'multi_select',
  'true_false',
  'fill_blank',
  'matching',
]);

export const answerOptionSchema = z.object({
  content: z.string().min(1, 'Nội dung phương án không được để trống'),
  is_correct: z.boolean(),
  order_index: z.number().int().nonnegative().default(0),
});

export const wizardQuestionSchema = z.object({
  temp_id: z.string().min(1),
  topic_temp_id: z.string().min(1),
  content: z.string().min(1, 'Nội dung câu hỏi không được để trống'),
  question_type: questionTypeEnum,
  difficulty: z.number().int().min(1).max(5).default(1),
  evidence_quote: z.string().optional().default(''),
  explanation: z.string().optional().default(''),
  answer_options: z.array(answerOptionSchema).default([]),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});


export const wizardTopicSchema = z.object({
  temp_id: z.string().min(1),
  name: z.string().min(1, 'Tên chủ đề không được để trống'),
  description: z.string().optional().default(''),
});

export const wizardLessonSchema = z.object({
  temp_id: z.string().min(1),
  title: z.string().min(1, 'Tiêu đề bài học không được để trống'),
  summary: z.string().optional().default(''),
  order_index: z.number().int().nonnegative().default(0),
  page_range: z.string().optional().default(''),
  status: z.enum(['pending', 'processing', 'ready', 'error']).default('pending'),
  topics_count: z.number().int().nonnegative().default(0),
  questions_count: z.number().int().nonnegative().default(0),
  error_message: z.string().optional(),
});

// Step 1: Upload & Initial extraction
export const step1CurriculumSchema = z.object({
  class_id: z.string().uuid('Mã lớp học phải là UUID hợp lệ'),
  document_text: z.string().optional(),
});

// Auto-save lessons reordering / CRUD
export const saveDraftLessonsSchema = z.object({
  class_id: z.string().uuid('Mã lớp học phải là UUID hợp lệ'),
  curriculum_title: z.string().min(1, 'Tiêu đề giáo trình không được để trống'),
  description: z.string().optional().default(''),
  lessons: z.array(wizardLessonSchema).min(1, 'Cần ít nhất một bài học trong lộ trình'),
});

// Step 2: Trigger batch generation
export const step2GenerateContentSchema = z.object({
  class_id: z.string().uuid('Mã lớp học phải là UUID hợp lệ'),
  lesson_temp_ids: z.array(z.string()).optional(),
});

// Update modal detail (Topics + Questions of a lesson)
export const updateLessonDetailSchema = z.object({
  class_id: z.string().uuid('Mã lớp học phải là UUID hợp lệ'),
  lesson_temp_id: z.string().min(1),
  topics: z.array(wizardTopicSchema),
  questions: z.array(wizardQuestionSchema),
});

// Regenerate a single question
export const regenerateQuestionSchema = z.object({
  class_id: z.string().uuid('Mã lớp học phải là UUID hợp lệ'),
  lesson_temp_id: z.string().min(1),
  question_temp_id: z.string().min(1),
  instruction: z.string().optional(),
});

// Step 4: Commit transaction
export const commitWizardSchema = z.object({
  class_id: z.string().uuid('Mã lớp học phải là UUID hợp lệ'),
});

// Types inferred from schemas
export type WizardLesson = z.infer<typeof wizardLessonSchema>;
export type WizardTopic = z.infer<typeof wizardTopicSchema>;
export type WizardQuestion = z.infer<typeof wizardQuestionSchema>;
export type AnswerOptionInput = z.infer<typeof answerOptionSchema>;
export type SaveDraftLessonsInput = z.infer<typeof saveDraftLessonsSchema>;
export type UpdateLessonDetailInput = z.infer<typeof updateLessonDetailSchema>;
export type RegenerateQuestionInput = z.infer<typeof regenerateQuestionSchema>;
export type CommitWizardInput = z.infer<typeof commitWizardSchema>;

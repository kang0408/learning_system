import {
  saveDraftLessonsSchema,
  updateLessonDetailSchema,
  wizardQuestionSchema,
} from '../ai-wizard.schema';

describe('AI Wizard Zod Schemas', () => {
  it('should validate valid draft lessons correctly', () => {
    const validData = {
      class_id: '123e4567-e89b-12d3-a456-426614174000',
      curriculum_title: 'English Grade 10',
      description: 'Term 1 curriculum',
      lessons: [
        {
          temp_id: 'lesson_1',
          title: 'Unit 1: Family Life',
          summary: 'Present Simple and Family Chores',
          order_index: 1,
          page_range: '5-18',
          status: 'pending',
          topics_count: 0,
          questions_count: 0,
        },
      ],
    };

    const parsed = saveDraftLessonsSchema.parse(validData);
    expect(parsed.curriculum_title).toBe('English Grade 10');
    expect(parsed.lessons).toHaveLength(1);
  });

  it('should validate question with evidence_quote and options', () => {
    const questionData = {
      temp_id: 'q_1',
      topic_temp_id: 'topic_1',
      content: 'He ____ to school every day.',
      question_type: 'multiple_choice',
      difficulty: 2,
      evidence_quote: 'Page 6: He goes to school every day.',
      explanation: 'Present simple third person singular.',
      answer_options: [
        { content: 'goes', is_correct: true, order_index: 0 },
        { content: 'go', is_correct: false, order_index: 1 },
      ],
    };

    const parsed = wizardQuestionSchema.parse(questionData);
    expect(parsed.evidence_quote).toBe('Page 6: He goes to school every day.');
    expect(parsed.answer_options[0].is_correct).toBe(true);
  });

  it('should reject invalid question_type', () => {
    const invalidQuestion = {
      temp_id: 'q_1',
      topic_temp_id: 'topic_1',
      content: 'Test question',
      question_type: 'invalid_type',
      difficulty: 1,
      answer_options: [],
    };

    expect(() => wizardQuestionSchema.parse(invalidQuestion)).toThrow();
  });

  it('should validate and parse content_html in updateLessonDetailSchema and wizardLessonSchema', () => {
    const updateData = {
      class_id: '123e4567-e89b-12d3-a456-426614174000',
      lesson_temp_id: 'lesson_1',
      topics: [{ temp_id: 'top_1', name: 'Topic 1' }],
      questions: [],
      content_html: '<h3>1. Mục tiêu bài học</h3><p>Lý thuyết chi tiết</p>',
    };

    const parsed = updateLessonDetailSchema.parse(updateData);
    expect(parsed.content_html).toBe('<h3>1. Mục tiêu bài học</h3><p>Lý thuyết chi tiết</p>');
  });
});

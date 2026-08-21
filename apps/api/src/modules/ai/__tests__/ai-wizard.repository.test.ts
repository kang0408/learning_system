import { AiWizardRepository } from '../ai-wizard.repository';

describe('AiWizardRepository', () => {
  let repository: AiWizardRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      aiWizardDraft: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      classCurriculum: {
        create: jest.fn().mockResolvedValue({ id: 'curriculum-1' }),
      },
      assignment: {
        create: jest.fn().mockResolvedValue({ id: 'assignment-1' }),
      },
      curriculumAssignment: {
        create: jest.fn().mockResolvedValue({ id: 'curriculum-assignment-1' }),
      },
      topic: {
        create: jest.fn().mockResolvedValue({ id: 'topic-1' }),
      },
      question: {
        create: jest.fn().mockResolvedValue({ id: 'question-1' }),
      },
      answerOption: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      assignmentQuestion: {
        create: jest.fn().mockResolvedValue({ id: 'assignment-question-1' }),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(mockPrisma);
      }),
    };

    repository = new AiWizardRepository(mockPrisma);
  });

  it('should find active draft for teacher and class', async () => {
    mockPrisma.aiWizardDraft.findUnique.mockResolvedValueOnce({
      id: 'draft-1',
      teacher_id: 'teacher-1',
      class_id: 'class-1',
      step: 'curriculum_ready',
      payload: {},
    });

    const result = await repository.findActiveDraft('teacher-1', 'class-1');
    expect(result?.id).toBe('draft-1');
  });

  it('should upsert draft properly', async () => {
    mockPrisma.aiWizardDraft.upsert.mockResolvedValueOnce({
      id: 'draft-1',
      step: 'generating',
    });

    const result = await repository.saveOrUpdateDraft(
      'teacher-1',
      'class-1',
      'generating',
      'syllabus.pdf',
      {
        curriculum_title: 'English 10',
        lessons: [],
        topicsByLesson: {},
        questionsByLesson: {},
      }
    );

    expect(mockPrisma.aiWizardDraft.upsert).toHaveBeenCalled();
    expect(result.id).toBe('draft-1');
  });

  it('should commit entire wizard data inside transaction and delete draft', async () => {
    const payload = {
      curriculum_title: 'English 10',
      lessons: [
        {
          temp_id: 'lesson_1',
          title: 'Unit 1: Family Life',
          summary: 'Present Simple',
          order_index: 1,
          page_range: '1-10',
          status: 'ready' as const,
          topics_count: 1,
          questions_count: 1,
        },
      ],
      topicsByLesson: {
        lesson_1: [
          {
            temp_id: 'top_1',
            name: 'Present Simple',
            description: 'Grammar rule',
          },
        ],
      },
      questionsByLesson: {
        lesson_1: [
          {
            temp_id: 'q_1',
            topic_temp_id: 'top_1',
            content: 'She ____ English.',
            question_type: 'multiple_choice' as const,
            difficulty: 2,
            evidence_quote: 'Page 5: She studies English.',
            explanation: 'Present Simple rule',
            answer_options: [
              { content: 'studies', is_correct: true, order_index: 0 },
              { content: 'study', is_correct: false, order_index: 1 },
            ],
            metadata: {},
          },
        ],
      },
    };

    const summary = await repository.commitWizardToDatabase('teacher-1', 'class-1', payload);

    expect(summary.curriculums_created).toBe(1);
    expect(summary.assignments_created).toBe(1);
    expect(summary.topics_created).toBe(1);
    expect(summary.questions_created).toBe(1);
    expect(mockPrisma.aiWizardDraft.deleteMany).toHaveBeenCalledWith({
      where: { teacher_id: 'teacher-1', class_id: 'class-1' },
    });
  });
});

import { AiWizardService } from '../ai-wizard.service';
import { WizardLesson, WizardQuestion } from '../ai-wizard.schema';

describe('AiWizardService', () => {
  let aiWizardService: AiWizardService;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    mockGenerateContent = jest.fn();
    const mockAiClient = {
      models: {
        generateContent: mockGenerateContent,
      },
    } as any;

    aiWizardService = new AiWizardService(mockAiClient);
  });

  it('should extract curriculum outline correctly in Step 1', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        curriculum_title: 'Tiếng Anh Lớp 10',
        description: 'Lộ trình cơ bản',
        lessons: [
          {
            temp_id: 'lesson_1',
            title: 'Unit 1: Family Life',
            summary: 'Present Simple',
            order_index: 1,
            page_range: '1-10',
          },
        ],
      }),
    });

    const result = await aiWizardService.extractCurriculumOutline('sample document text');
    expect(result.curriculum_title).toBe('Tiếng Anh Lớp 10');
    expect(result.lessons).toHaveLength(1);
    expect(result.lessons[0].status).toBe('pending');
  });

  it('should generate unit topics and questions in Step 2', async () => {
    const lesson: WizardLesson = {
      temp_id: 'lesson_1',
      title: 'Unit 1: Family Life',
      summary: 'Present Simple',
      order_index: 1,
      page_range: '1-10',
      status: 'pending',
      topics_count: 0,
      questions_count: 0,
    };

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        topics: [
          { temp_id: 'top_lesson_1_1', name: 'Present Simple', description: 'Grammar' },
        ],
        questions: [
          {
            temp_id: 'q_lesson_1_1',
            topic_temp_id: 'top_lesson_1_1',
            content: 'She ____ English.',
            question_type: 'multiple_choice',
            difficulty: 2,
            evidence_quote: 'Page 5: She studies English.',
            explanation: 'Present Simple rule',
            answer_options: [
              { content: 'studies', is_correct: true, order_index: 0 },
              { content: 'study', is_correct: false, order_index: 1 },
            ],
          },
        ],
      }),
    });

    const result = await aiWizardService.generateUnitTopicsAndQuestions(lesson, 'unit 1 text');
    expect(result.topics).toHaveLength(1);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].evidence_quote).toBe('Page 5: She studies English.');
  });

  it('should batch generate multiple units with progress callback', async () => {
    const lessons: WizardLesson[] = [
      {
        temp_id: 'lesson_1',
        title: 'Unit 1',
        summary: 'Unit 1 summary',
        order_index: 1,
        page_range: '1-10',
        status: 'pending',
        topics_count: 0,
        questions_count: 0,
      },
      {
        temp_id: 'lesson_2',
        title: 'Unit 2',
        summary: 'Unit 2 summary',
        order_index: 2,
        page_range: '11-20',
        status: 'pending',
        topics_count: 0,
        questions_count: 0,
      },
    ];


    mockGenerateContent
      .mockResolvedValueOnce({
        text: JSON.stringify({
          topics: [{ temp_id: 'top_1', name: 'Topic 1' }],
          questions: [
            {
              temp_id: 'q_1',
              topic_temp_id: 'top_1',
              content: 'Question 1',
              question_type: 'multiple_choice',
              difficulty: 1,
              answer_options: [{ content: 'A', is_correct: true, order_index: 0 }],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          topics: [{ temp_id: 'top_2', name: 'Topic 2' }],
          questions: [
            {
              temp_id: 'q_2',
              topic_temp_id: 'top_2',
              content: 'Question 2',
              question_type: 'multiple_choice',
              difficulty: 2,
              answer_options: [{ content: 'B', is_correct: true, order_index: 0 }],
            },
          ],
        }),
      });

    const progressEvents: any[] = [];
    const onProgress = (event: any) => progressEvents.push(event);

    const result = await aiWizardService.generateBatchUnitsContent(lessons, {}, onProgress);

    expect(result.lessons[0].status).toBe('ready');
    expect(result.lessons[1].status).toBe('ready');
    expect(progressEvents.some((e) => e.type === 'unit_started')).toBe(true);
    expect(progressEvents.some((e) => e.type === 'unit_completed')).toBe(true);
    expect(progressEvents.some((e) => e.type === 'all_completed')).toBe(true);
  });

  it('should regenerate a single question', async () => {
    const currentQ: WizardQuestion = {
      temp_id: 'q_1',
      topic_temp_id: 'top_1',
      content: 'Old question',
      question_type: 'multiple_choice',
      difficulty: 1,
      evidence_quote: 'Quote',
      explanation: 'Old exp',
      answer_options: [{ content: 'Old A', is_correct: true, order_index: 0 }],
      metadata: {},
    };


    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        content: 'New regenerated question',
        question_type: 'multiple_choice',
        difficulty: 3,
        evidence_quote: 'New Quote',
        explanation: 'New exp',
        answer_options: [{ content: 'New A', is_correct: true, order_index: 0 }],
      }),
    });

    const result = await aiWizardService.regenerateSingleQuestion(currentQ, 'context text', 'Make it harder');
    expect(result.content).toBe('New regenerated question');
    expect(result.difficulty).toBe(3);
    expect(result.temp_id).toBe('q_1');
  });
});

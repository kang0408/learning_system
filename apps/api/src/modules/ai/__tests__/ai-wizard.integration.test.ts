import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { aiWizardService } from '../ai-wizard.routes';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    aiWizardDraft: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    classCurriculum: {
      create: jest.fn(),
    },
    assignment: {
      create: jest.fn(),
    },
    curriculumAssignment: {
      create: jest.fn(),
    },
    topic: {
      create: jest.fn(),
    },
    question: {
      create: jest.fn(),
    },
    answerOption: {
      createMany: jest.fn(),
    },
    assignmentQuestion: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (cb: any) => {
      const mockTx = {
        classCurriculum: { create: jest.fn().mockResolvedValue({ id: 'curriculum-1' }) },
        assignment: { create: jest.fn().mockResolvedValue({ id: 'assignment-1' }) },
        curriculumAssignment: { create: jest.fn().mockResolvedValue({ id: 'ca-1' }) },
        topic: { create: jest.fn().mockResolvedValue({ id: 'topic-1' }) },
        question: { create: jest.fn().mockResolvedValue({ id: 'q-1' }) },
        answerOption: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
        assignmentQuestion: { create: jest.fn().mockResolvedValue({ id: 'aq-1' }) },
        aiWizardDraft: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      };
      return cb(mockTx);
    }),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_1234567890123456';
const teacherId = 'a1111111-1111-4111-8111-111111111111';
const studentId = 'a2222222-2222-4222-8222-222222222222';
const classId = 'a3333333-3333-4333-8333-333333333333';

const teacherToken = jwt.sign({ userId: teacherId, role: 'teacher' }, JWT_SECRET);

const studentToken = jwt.sign({ userId: studentId, role: 'student' }, JWT_SECRET);

describe('AI Curriculum Wizard Full Pipeline Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Security & RBAC Controls', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get(`/api/ai/wizard/active-draft?class_id=${classId}`);
      expect(res.status).toBe(401);
    });

    it('should reject student role with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/ai/wizard/active-draft?class_id=${classId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Step 1: Upload & Initial Outline Extraction', () => {
    it('should extract curriculum outline from text and save initial draft', async () => {
      jest.spyOn(aiWizardService, 'extractCurriculumOutline').mockResolvedValueOnce({
        curriculum_title: 'English Grade 10 - Global Success',
        description: 'Semester 1 Curriculum',
        lessons: [
          {
            temp_id: 'lesson_1',
            title: 'Unit 1: Family Life',
            summary: 'Present Simple & Household chores',
            order_index: 1,
            page_range: '5-18',
            status: 'pending',
            topics_count: 0,
            questions_count: 0,
          },
        ],
      });

      (prisma.aiWizardDraft.upsert as jest.Mock).mockResolvedValueOnce({
        id: 'draft-uuid-1',
        teacher_id: teacherId,
        class_id: classId,
        step: 'curriculum_ready',
      });

      const res = await request(app)
        .post('/api/ai/wizard/step1-curriculum')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          document_text: '# Unit 1: Family Life\nGrammar: Present Simple',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      expect(res.body.data.curriculum_title).toBe('English Grade 10 - Global Success');
      expect(res.body.data.lessons).toHaveLength(1);
    });
  });

  describe('Step 1.5: Drag & Drop Reorder / Edit Lessons', () => {
    it('should save reordered lesson cards to active draft', async () => {
      (prisma.aiWizardDraft.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'draft-uuid-1',
        teacher_id: teacherId,
        class_id: classId,
        payload: {
          curriculum_title: 'English 10',
          lessons: [],
        },
      });

      (prisma.aiWizardDraft.upsert as jest.Mock).mockResolvedValueOnce({
        id: 'draft-uuid-1',
      });

      const res = await request(app)
        .patch('/api/ai/wizard/draft/lessons')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          curriculum_title: 'English 10 (Updated)',
          lessons: [
            {
              temp_id: 'lesson_1',
              title: 'Unit 1: Family Life (Renamed)',
              summary: 'Present Simple',
              order_index: 1,
              page_range: '5-18',
              status: 'pending',
              topics_count: 0,
              questions_count: 0,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Step 2: Batch Generation of Topics & Questions', () => {
    it('should batch generate topics and questions and update draft status', async () => {
      (prisma.aiWizardDraft.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'draft-uuid-1',
        teacher_id: teacherId,
        class_id: classId,
        payload: {
          curriculum_title: 'English 10',
          lessons: [
            {
              temp_id: 'lesson_1',
              title: 'Unit 1: Family Life',
              summary: 'Present Simple',
              order_index: 1,
              page_range: '5-18',
              status: 'pending',
              topics_count: 0,
              questions_count: 0,
            },
          ],
          topicsByLesson: {},
          questionsByLesson: {},
          textChunks: {},
        },
      });

      jest.spyOn(aiWizardService, 'generateBatchUnitsContent').mockResolvedValueOnce({
        lessons: [
          {
            temp_id: 'lesson_1',
            title: 'Unit 1: Family Life',
            summary: 'Present Simple',
            order_index: 1,
            page_range: '5-18',
            status: 'ready',
            topics_count: 1,
            questions_count: 1,
          },
        ],
        topicsByLesson: {
          lesson_1: [
            { temp_id: 'top_1', name: 'Present Simple', description: 'Rules' },
          ],
        },
        questionsByLesson: {
          lesson_1: [
            {
              temp_id: 'q_1',
              topic_temp_id: 'top_1',
              content: 'She ____ to school.',
              question_type: 'multiple_choice',
              difficulty: 2,
              evidence_quote: 'Page 5: She goes to school.',
              explanation: 'Present simple third person',
              answer_options: [{ content: 'goes', is_correct: true, order_index: 0 }],
              metadata: {},
            },
          ],
        },
      });

      (prisma.aiWizardDraft.upsert as jest.Mock).mockResolvedValueOnce({
        id: 'draft-uuid-1',
      });

      const res = await request(app)
        .post('/api/ai/wizard/step2-generate-content')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ class_id: classId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topicsByLesson.lesson_1).toHaveLength(1);
      expect(res.body.data.questionsByLesson.lesson_1).toHaveLength(1);
    });
  });

  describe('Step 3: Modal Inspection & Single Question Regeneration', () => {
    it('should update modal details for a specific lesson', async () => {
      (prisma.aiWizardDraft.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'draft-uuid-1',
        payload: {
          lessons: [{ temp_id: 'lesson_1', title: 'Unit 1', order_index: 1 }],
          topicsByLesson: {},
          questionsByLesson: {},
        },
      });

      (prisma.aiWizardDraft.upsert as jest.Mock).mockResolvedValueOnce({ id: 'draft-uuid-1' });

      const res = await request(app)
        .patch('/api/ai/wizard/draft/lesson-detail')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          lesson_temp_id: 'lesson_1',
          topics: [{ temp_id: 'top_1', name: 'Present Simple Edited' }],
          questions: [
            {
              temp_id: 'q_1',
              topic_temp_id: 'top_1',
              content: 'Edited question?',
              question_type: 'multiple_choice',
              difficulty: 3,
              evidence_quote: 'Page 5',
              explanation: 'Edited explanation',
              answer_options: [{ content: 'Yes', is_correct: true, order_index: 0 }],
              metadata: {},
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should regenerate a single question in Modal', async () => {
      (prisma.aiWizardDraft.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'draft-uuid-1',
        payload: {
          questionsByLesson: {
            lesson_1: [
              {
                temp_id: 'q_1',
                topic_temp_id: 'top_1',
                content: 'Old Q',
                question_type: 'multiple_choice',
                difficulty: 2,
                evidence_quote: 'Quote',
                explanation: 'Exp',
                answer_options: [{ content: 'A', is_correct: true, order_index: 0 }],
                metadata: {},
              },
            ],
          },
          textChunks: { lesson_1: 'Context for lesson 1' },
        },
      });

      jest.spyOn(aiWizardService, 'regenerateSingleQuestion').mockResolvedValueOnce({
        temp_id: 'q_1',
        topic_temp_id: 'top_1',
        content: 'Brand new regenerated question',
        question_type: 'multiple_choice',
        difficulty: 4,
        evidence_quote: 'Quote updated',
        explanation: 'Exp updated',
        answer_options: [{ content: 'New correct answer', is_correct: true, order_index: 0 }],
        metadata: {},
      });

      (prisma.aiWizardDraft.upsert as jest.Mock).mockResolvedValueOnce({ id: 'draft-uuid-1' });

      const res = await request(app)
        .post('/api/ai/wizard/regenerate-question')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          lesson_temp_id: 'lesson_1',
          question_temp_id: 'q_1',
          instruction: 'Tăng độ khó câu hỏi',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.question.content).toBe('Brand new regenerated question');
    });
  });

  describe('Step 4: Commit to Database & Cleanup Draft', () => {
    it('should commit entire wizard to DB transaction and remove active draft', async () => {
      (prisma.aiWizardDraft.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'draft-uuid-1',
        payload: {
          curriculum_title: 'English 10',
          lessons: [
            {
              temp_id: 'lesson_1',
              title: 'Unit 1: Family Life',
              summary: 'Present Simple',
              order_index: 1,
              page_range: '5-18',
              status: 'ready',
              topics_count: 1,
              questions_count: 1,
            },
          ],
          topicsByLesson: {
            lesson_1: [{ temp_id: 'top_1', name: 'Present Simple' }],
          },
          questionsByLesson: {
            lesson_1: [
              {
                temp_id: 'q_1',
                topic_temp_id: 'top_1',
                content: 'She ____ to school.',
                question_type: 'multiple_choice',
                difficulty: 2,
                evidence_quote: 'Page 5',
                explanation: 'Explanation',
                answer_options: [{ content: 'goes', is_correct: true, order_index: 0 }],
                metadata: {},
              },
            ],
          },
        },
      });

      const res = await request(app)
        .post('/api/ai/wizard/commit')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ class_id: classId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.curriculums_created).toBe(1);
      expect(res.body.data.assignments_created).toBe(1);
    });

    it('should discard active draft when requested', async () => {
      (prisma.aiWizardDraft.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 });

      const res = await request(app)
        .delete(`/api/ai/wizard/draft?class_id=${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

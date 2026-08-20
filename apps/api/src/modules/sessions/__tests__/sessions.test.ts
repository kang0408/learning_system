import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    assignment: {
      findUnique: jest.fn(),
    },
    assignmentQuestion: {
      findMany: jest.fn(),
    },
    quizSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    sessionAnswer: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    sm2Progress: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    answerOption: {
      findMany: jest.fn(),
    },
    question: {
      findUnique: jest.fn(),
    },
    topic: {
      findMany: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $transaction: jest.fn((cb) => (typeof cb === 'function' ? cb(prisma) : Promise.all(cb))),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_1234567890123456';
const studentId = '11111111-1111-4111-a111-111111111111';
const assignmentId = '22222222-2222-4222-a222-222222222222';
const sessionId = '33333333-3333-4333-a333-333333333333';
const questionId = '44444444-4444-4444-a444-444444444444';
const optionCorrectId = '55555555-5555-4555-a555-555555555555';
const optionWrongId = '66666666-6666-4666-a666-666666666666';

const studentToken = jwt.sign({ userId: studentId, role: 'student' }, JWT_SECRET);

describe('Quiz Sessions & Anti-cheat Test Suite (Section 4.2.5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC_SES_01: Khởi tạo phiên làm bài thích ứng (Adaptive Session)', () => {
    it('should start an adaptive session with due and new questions and return 201', async () => {
      (prisma.quizSession.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({
        id: assignmentId,
        title: 'Kiểm tra Thích ứng - Unit 1',
        mode: 'adaptive',
        is_published: true,
        max_attempts: 0,
        time_limit: 15, // 15 mins
      });

      // Mock getDueQuestions and getNewQuestions via $queryRawUnsafe
      (prisma.$queryRawUnsafe as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: questionId,
            content: 'She _____ to work every day.',
            question_type: 'multiple_choice',
            difficulty: 3,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: '77777777-7777-4777-a777-777777777777',
            content: 'He _____ soccer on Sundays.',
            question_type: 'multiple_choice',
            difficulty: 2,
          },
        ]);

      (prisma.answerOption.findMany as jest.Mock).mockResolvedValue([
        { id: optionCorrectId, content: 'goes', is_correct: true, order_index: 0 },
        { id: optionWrongId, content: 'go', is_correct: false, order_index: 1 },
      ]);
      (prisma.quizSession.create as jest.Mock).mockResolvedValue({
        id: sessionId,
        student_id: studentId,
        assignment_id: assignmentId,
        total_q: 2,
        status: 'in_progress',
        started_at: new Date(),
      });


      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          assignment_id: assignmentId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.session_id).toBe(sessionId);
      expect(res.body.data.total_questions).toBe(2);
      expect(res.body.data.first_question).toBeDefined();
    });
  });

  describe('TC_SES_02: Nộp câu trả lời và nhận kết quả tức thì (SM-2 Update)', () => {
    it('should evaluate answer, update SM-2 progress, and return immediate feedback', async () => {
      (prisma.quizSession.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        student_id: studentId,
        status: 'in_progress',
        started_at: new Date(Date.now() - 30000), // 30s ago
        answered_q: 0,
        correct_q: 0,
        total_q: 5,
        assignment: {
          id: assignmentId,
          mode: 'adaptive',
          time_limit: 15,
        },
      });

      (prisma.answerOption.findMany as jest.Mock).mockResolvedValue([
        { id: optionCorrectId, content: 'went', is_correct: true },
        { id: optionWrongId, content: 'go', is_correct: false },
      ]);
      (prisma.sm2Progress.findUnique as jest.Mock).mockResolvedValue({
        easiness_factor: 2.50,
        interval_days: 1,
        repetition_count: 0,
      });
      (prisma.sessionAnswer.create as jest.Mock).mockResolvedValue({ id: 'ans-1' });
      (prisma.sm2Progress.upsert as jest.Mock).mockResolvedValue({});
      (prisma.quizSession.update as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          question_id: questionId,
          selected_option_id: optionCorrectId,
          response_time_ms: 2500, // < 5s -> q = 5
        });

      expect(res.status).toBe(200);
      expect(res.body.data.is_correct).toBe(true);
      expect(res.body.data.sm2_quality).toBe(5);
      expect(res.body.data.next_review_in_days).toBe(1);
    });
  });

  describe('TC_SES_03: Ngăn chặn gian lận vượt quá thời gian thi (Anti-cheat Bypass)', () => {
    it('should reject answer with 403 Forbidden and force finish session when past deadline + 15s grace period', async () => {
      const fifteenMinutesAndTwentySecondsAgo = new Date(Date.now() - (15 * 60 * 1000 + 20000));
      (prisma.quizSession.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        student_id: studentId,
        status: 'in_progress',
        started_at: fifteenMinutesAndTwentySecondsAgo,
        answered_q: 5,
        correct_q: 4,
        total_q: 10,
        assignment: {
          id: assignmentId,
          time_limit: 15, // 15 mins
        },
        session_answers: [],
      });
      (prisma.topic.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.quizSession.update as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          question_id: questionId,
          selected_option_id: optionCorrectId,
          response_time_ms: 2000,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/hết thời gian làm bài/i);
    });
  });

  describe('TC_SES_04: Hoàn thành bài thi và tính tổng điểm (Finish Session)', () => {
    it('should finish session, compute score, and clean up Redis cache', async () => {
      (prisma.quizSession.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        student_id: studentId,
        status: 'in_progress',
        started_at: new Date(Date.now() - 300000), // 5 mins ago
        answered_q: 10,
        correct_q: 8,
        total_q: 10,
        session_answers: [
          { is_correct: true, question: { topic: { id: 't1', name: 'Grammar' } } },
          { is_correct: false, question: { topic: { id: 't1', name: 'Grammar' } } },
        ],
      });
      (prisma.topic.findMany as jest.Mock).mockResolvedValue([
        { id: 't1', name: 'Grammar', parent_id: null },
      ]);
      (prisma.quizSession.update as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/finish`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.session_id).toBe(sessionId);
      expect(res.body.data.score).toBe(80); // 8/10 * 100
      expect(res.body.data.correct_questions).toBe(8);
      expect(res.body.data.total_questions).toBe(10);
    });
  });

  describe('TC_SES_05: Làm bài thi dạng Điền từ (Fill in blank)', () => {
    it('should normalize and accurately evaluate fill-in-the-blank answer', async () => {
      (prisma.quizSession.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        student_id: studentId,
        status: 'in_progress',
        started_at: new Date(),
        answered_q: 0,
        correct_q: 0,
        total_q: 1,
        assignment: { id: assignmentId, mode: 'fixed' },
      });
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({
        id: questionId,
        question_type: 'fill_blank',
        difficulty: 3,
      });
      (prisma.answerOption.findMany as jest.Mock).mockResolvedValue([
        { id: 'opt-fill', content: 'went', is_correct: true },
      ]);

      (prisma.sm2Progress.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sessionAnswer.create as jest.Mock).mockResolvedValue({});
      (prisma.quizSession.update as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          question_id: questionId,
          fill_text: '  WENT  ', // Uppercase with surrounding whitespace
          response_time_ms: 3000,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.is_correct).toBe(true);
    });
  });
});

import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    class: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    classMember: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    question: {
      count: jest.fn(),
    },
    assignment: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    quizSession: {
      count: jest.fn(),
      findMany: jest.fn(),
    },

    sessionAnswer: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    sm2Progress: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    aiReport: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    topic: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_1234567890123456';
const studentId = '11111111-1111-4111-a111-111111111111';
const teacherId = '22222222-2222-4222-a222-222222222222';
const adminId = '33333333-3333-4333-a333-333333333333';


const studentToken = jwt.sign({ userId: studentId, role: 'student' }, JWT_SECRET);
const teacherToken = jwt.sign({ userId: teacherId, role: 'teacher' }, JWT_SECRET);
const adminToken = jwt.sign({ userId: adminId, role: 'admin' }, JWT_SECRET);

describe('Analytics & Reports Test Suite (Section 4.2.6 & 4.3.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC_JOB_03: Thống kê ma trận kiến thức học sinh (Student Weak Topics & Radar Matrix)', () => {
    it('should return radar matrix and knowledge accuracy per topic', async () => {
      // Mock weak topics & topic performance
      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([
          { topic: 'Past Simple', topic_id: 't1', accuracy_pct: 60, total_reviews: 10, total_correct: 6, retention_rate: 60 },
          { topic: 'Present Perfect', topic_id: 't2', accuracy_pct: 45, total_reviews: 12, total_correct: 5, retention_rate: 45 },
        ]) // getWeakTopicsBySM2
        .mockResolvedValueOnce([
          { topic: 'Past Simple', recent_accuracy_pct: 70 },
          { topic: 'Present Perfect', recent_accuracy_pct: 40 },
        ]) // getRecentTopicAccuracy
        .mockResolvedValueOnce([
          { topic: 'Past Simple', topic_id: 't1', total_q: 10, correct_q: 6, accuracy_pct: 60 },
          { topic: 'Present Perfect', topic_id: 't2', total_q: 12, correct_q: 5, accuracy_pct: 41.7 },
        ]); // getTopicPerformance

      (prisma.topic.findMany as jest.Mock).mockResolvedValue([
        { id: 't1', name: 'Past Simple', parent_id: null },
        { id: 't2', name: 'Present Perfect', parent_id: null },
      ]);

      const res = await request(app)
        .get('/api/analytics/student/me/weak-topics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.weak_topics.length).toBe(2);
      expect(res.body.data.topic_performance.length).toBe(2);
      expect(res.body.data.weak_topics[0].topic).toBe('Past Simple');
      expect(res.body.data.weak_topics[0].trend).toBe('improving');
    });

    it('should return student learning overview dashboard stats', async () => {
      (prisma.quizSession.count as jest.Mock).mockResolvedValue(15);
      (prisma.sessionAnswer.count as jest.Mock)
        .mockResolvedValueOnce(150) // total answers
        .mockResolvedValueOnce(120); // correct answers
      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([
          { date: new Date().toISOString() },
        ]) // getActiveDates
        .mockResolvedValueOnce([
          { total_questions: 50, new_count: 10, learning_count: 20, mastered_count: 20, due_today: 5 },
        ]) // getSM2Summary
        .mockResolvedValueOnce([
          { day_of_week: 'Mon', questions_count: 20 },
        ]); // getWeeklyActivity
      (prisma.aiReport.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/analytics/student/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_sessions).toBe(15);
      expect(res.body.data.total_questions_answered).toBe(150);
      expect(res.body.data.overall_accuracy).toBe(80);
      expect(res.body.data.sm2_summary.total_questions).toBe(50);
    });
  });

  describe('Báo cáo thống kê lớp học cho giáo viên (Teacher Class Analytics)', () => {
    it('should return aggregated class stats and AI pedagogical insight', async () => {
      const classId = 'c1111111-1111-4111-a111-111111111111';
      (prisma.class.findFirst as jest.Mock).mockResolvedValue({
        id: classId,
        name: 'Lớp 10A1',
        teacher_id: teacherId,
      });
      (prisma.classMember.count as jest.Mock).mockResolvedValue(25);
      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ active_count: 20 }]) // current active
        .mockResolvedValueOnce([{ active_count: 18 }]) // prev active
        .mockResolvedValueOnce([{ avg_score: 82.5 }]) // current avg
        .mockResolvedValueOnce([{ avg_score: 78.0 }]) // prev avg
        .mockResolvedValueOnce([{ total_questions: 200, new_count: 30, learning_count: 70, mastered_count: 100, due_today: 15 }]); // sm2 summary

      (prisma.aiReport.findFirst as jest.Mock).mockResolvedValue({
        id: 'ai-report-1',
        report: {
          class_status: 'Lớp tiến bộ tốt ở phần Ngữ pháp cơ bản.',
          pedagogical_advice: 'Cần củng cố thêm thì Hiện tại Hoàn thành.',
        },
        created_at: new Date(),
      });

      const res = await request(app)
        .get(`/api/analytics/class/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.class_name).toBe('Lớp 10A1');
      expect(res.body.data.total_students).toBe(25);
      expect(res.body.data.average_score.current).toBe(83);
      expect(res.body.data.ai_insight).toBeDefined();
    });
  });

  describe('Thống kê hệ thống quản trị viên (Admin System Analytics)', () => {
    it('should return system metrics and health status for Admin', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.user.groupBy as jest.Mock).mockResolvedValue([
        { role: 'student', _count: { id: 85 } },
        { role: 'teacher', _count: { id: 10 } },
        { role: 'admin', _count: { id: 5 } },
      ]);
      (prisma.class.count as jest.Mock).mockResolvedValue(12);
      (prisma.question.count as jest.Mock).mockResolvedValue(450);
      (prisma.quizSession.count as jest.Mock).mockResolvedValue(1200);
      (prisma.aiReport.count as jest.Mock).mockResolvedValue(80);
      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ size: '128 MB' }])
        .mockResolvedValueOnce([{ count: BigInt(8) }])
        .mockResolvedValueOnce([{ cache_hit_ratio: 99.8 }])
        .mockResolvedValueOnce([{ active_xacts: 0 }])
        .mockResolvedValueOnce([{ slow_queries: 0 }]);

      const res = await request(app)
        .get('/api/analytics/admin/system')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(['HEALTHY', 'WARNING', 'CRITICAL']).toContain(res.body.data.status);
      expect(res.body.data.users.total).toBe(100);

      expect(res.body.data.database.databaseSize).toBe('128 MB');

    });
  });
});

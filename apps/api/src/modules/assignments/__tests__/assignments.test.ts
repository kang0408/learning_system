import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { emailQueue } from '../../../jobs/emailQueue';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    class: {
      findUnique: jest.fn(),
    },
    topic: {
      findMany: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
    assignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    classMember: {
      findUnique: jest.fn(),
    },
    assignmentQuestion: {
      deleteMany: jest.fn(),
    },
    assignmentStudent: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callbackOrArray) => {
      if (typeof callbackOrArray === 'function') {
        return callbackOrArray(prisma);
      }
      return Promise.all(callbackOrArray);
    }),
  },
}));

jest.mock('../../../jobs/emailQueue', () => ({
  emailQueue: {
    add: jest.fn().mockResolvedValue(true),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_1234567890123456';
const teacherId = 'a1111111-1111-4111-a111-111111111111';
const otherTeacherId = 'a2222222-2222-4222-a222-222222222222';
const studentId = 'b1111111-1111-4111-a111-111111111111';
const classId = 'c1111111-1111-4111-a111-111111111111';
const assignmentId = 'e1111111-1111-4111-a111-111111111111';
const questionId1 = 'q1111111-1111-4111-a111-111111111111';

const teacherToken = jwt.sign({ userId: teacherId, role: 'teacher' }, JWT_SECRET);
const otherTeacherToken = jwt.sign({ userId: otherTeacherId, role: 'teacher' }, JWT_SECRET);
const studentToken = jwt.sign({ userId: studentId, role: 'student' }, JWT_SECRET);

describe('Assignments Module Test Suite (UC-07 Quản lý bài tập)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tạo bài tập mới (POST /api/assignments)', () => {
    it('should create an assignment with questions and return 201', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: classId,
        teacher_id: teacherId,
      });

      (prisma.assignment.create as jest.Mock).mockResolvedValue({
        id: assignmentId,
        class_id: classId,
        created_by: teacherId,
        title: 'Bài tập Thì Hiện Tại Đơn',
        mode: 'adaptive',
        is_published: false,
      });

      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          title: 'Bài tập Thì Hiện Tại Đơn',
          mode: 'adaptive',
          question_ids: [questionId1],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(assignmentId);
    });

    it('should reject creation if no questions or topics are selected (400)', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: classId,
        teacher_id: teacherId,
      });

      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          title: 'Bài tập không câu hỏi',
          question_ids: [],
          topic_ids: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.message || res.body.error).toMatch(/Phải chọn ít nhất một câu hỏi/i);
    });

    it('should reject creation if teacher does not own class (403)', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: classId,
        teacher_id: otherTeacherId,
      });

      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          title: 'Bài tập',
          question_ids: [questionId1],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Xem danh sách bài tập (GET /api/assignments)', () => {
    it('should return assignments with calculated submission_rate and status', async () => {
      (prisma.assignment.findMany as jest.Mock).mockResolvedValue([
        {
          id: assignmentId,
          title: 'Quiz Unit 1',
          created_by: teacherId,
          class_id: classId,
          is_published: true,
          is_all_students: true,
          deadline: new Date(Date.now() + 86400000),
          class: { _count: { members: 10 } },
          assigned_students: [],
          quiz_sessions: [
            { id: 's1', student_id: 'st-1', status: 'completed', score: 9 },
            { id: 's2', student_id: 'st-2', status: 'completed', score: 8 },
          ],
          assignment_questions: [{ question_id: questionId1 }],
        },
      ]);
      (prisma.assignment.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get(`/api/assignments?class_id=${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].submission_rate).toBe(20); // 2/10 = 20%
      expect(res.body.data[0].status).toBe('ongoing');
      expect(res.body.data[0].avg_score).toBe(9);
    });
  });

  describe('Phát hành và Hủy phát hành bài tập', () => {
    it('should publish assignment and enqueue notification emails', async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({
        id: assignmentId,
        created_by: teacherId,
        title: 'Quiz Unit 1',
        deadline: new Date(),
        is_all_students: true,
        class: {
          members: [
            { student: { email: 'student1@example.com', full_name: 'Student 1' } },
          ],
        },
      });

      (prisma.assignment.update as jest.Mock).mockResolvedValue({
        id: assignmentId,
        is_published: true,
        published_at: new Date(),
      });

      const res = await request(app)
        .post(`/api/assignments/${assignmentId}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(emailQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'NEW_ASSIGNMENT',
          email: 'student1@example.com',
        })
      );
    });

    it('should unpublish assignment (return to draft mode)', async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({
        id: assignmentId,
        created_by: teacherId,
      });

      (prisma.assignment.update as jest.Mock).mockResolvedValue({
        id: assignmentId,
        is_published: false,
      });

      const res = await request(app)
        .post(`/api/assignments/${assignmentId}/unpublish`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Chỉnh sửa và Xóa bài tập', () => {
    it('should update assignment metadata', async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({
        id: assignmentId,
        created_by: teacherId,
        class_id: classId,
      });

      (prisma.assignment.update as jest.Mock).mockResolvedValue({
        id: assignmentId,
        title: 'Quiz Unit 1 (Đã sửa)',
      });

      const res = await request(app)
        .patch(`/api/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Quiz Unit 1 (Đã sửa)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should soft delete assignment with deleted_at', async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({
        id: assignmentId,
        created_by: teacherId,
      });

      (prisma.assignment.update as jest.Mock).mockResolvedValue({
        id: assignmentId,
        deleted_at: new Date(),
      });

      const res = await request(app)
        .delete(`/api/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.assignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: assignmentId },
          data: expect.objectContaining({ deleted_at: expect.any(Date) }),
        })
      );
    });
  });
});

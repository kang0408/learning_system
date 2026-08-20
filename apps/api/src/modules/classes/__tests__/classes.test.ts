import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    class: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    classMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_1234567890123456';
const teacherId = 'teacher-uuid-1';
const studentId = 'student-uuid-1';
const otherTeacherId = 'teacher-uuid-2';

const teacherToken = jwt.sign({ userId: teacherId, role: 'teacher' }, JWT_SECRET);
const studentToken = jwt.sign({ userId: studentId, role: 'student' }, JWT_SECRET);
const otherTeacherToken = jwt.sign({ userId: otherTeacherId, role: 'teacher' }, JWT_SECRET);

describe('Classes Module Test Suite (Section 4.2.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC_CLS_01: Tạo lớp học mới', () => {
    it('should create a new class with auto-generated join code and return 201', async () => {
      (prisma.class.create as jest.Mock).mockResolvedValue({
        id: 'class-1',
        name: 'Tiếng Anh Giao Tiếp Cơ Bản',
        subject: 'English',
        description: 'Khóa học cho người mới bắt đầu',
        teacher_id: teacherId,
        join_code: 'A1B2C3',
        is_active: true,
      });

      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Tiếng Anh Giao Tiếp Cơ Bản',
          subject: 'English',
          description: 'Khóa học cho người mới bắt đầu',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('class-1');
      expect(res.body.data.join_code).toBe('A1B2C3');
      expect(res.body.data.teacher_id).toBe(teacherId);
    });

    it('should reject class creation if missing name or subject', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          description: 'Thiếu tên và môn học',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('TC_CLS_02: Học sinh tham gia lớp bằng mã join_code', () => {
    it('should allow student to join class with valid 6-char join code and return 200', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'class-1',
        name: 'Tiếng Anh Giao Tiếp',
        join_code: 'A1B2C3',
        is_active: true,
        deleted_at: null,
      });
      (prisma.classMember.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.classMember.create as jest.Mock).mockResolvedValue({
        id: 'member-1',
        class_id: 'class-1',
        student_id: studentId,
        is_active: true,
      });

      const res = await request(app)
        .post('/api/classes/join')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          join_code: 'A1B2C3',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 when join code does not exist', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/classes/join')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          join_code: 'WRONG9',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/không tồn tại/i);
    });

    it('should return 409 when student is already an active member', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'class-1',
        join_code: 'A1B2C3',
        is_active: true,
      });
      (prisma.classMember.findUnique as jest.Mock).mockResolvedValue({
        id: 'member-1',
        class_id: 'class-1',
        student_id: studentId,
        is_active: true,
      });

      const res = await request(app)
        .post('/api/classes/join')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          join_code: 'A1B2C3',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('Quản lý lớp học nâng cao (Teacher)', () => {
    it('should retrieve list of classes owned by teacher', async () => {
      (prisma.class.findMany as jest.Mock).mockResolvedValue([
        { id: 'class-1', name: 'Lớp 1', teacher_id: teacherId },
        { id: 'class-2', name: 'Lớp 2', teacher_id: teacherId },
      ]);

      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should allow teacher to get class members', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'class-1',
        teacher_id: teacherId,
        is_active: true,
      });
      (prisma.classMember.findMany as jest.Mock).mockResolvedValue([
        { id: 'member-1', student_id: studentId, student: { full_name: 'Nguyen Van A' } },
      ]);
      (prisma.classMember.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/classes/class-1/members')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });


    it('should allow teacher to remove a member', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'class-1',
        teacher_id: teacherId,
        is_active: true,
      });
      (prisma.classMember.update as jest.Mock).mockResolvedValue({
        id: 'member-1',
        is_active: false,
      });

      const res = await request(app)
        .delete(`/api/classes/class-1/members/${studentId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
    });

    it('should allow teacher to delete/archive a class', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'class-1',
        teacher_id: teacherId,
        is_active: true,
      });
      (prisma.class.update as jest.Mock).mockResolvedValue({
        id: 'class-1',
        deleted_at: new Date(),
      });

      const res = await request(app)
        .delete('/api/classes/class-1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject unauthorized teacher from modifying class', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'class-1',
        teacher_id: teacherId,
        is_active: true,
      });

      const res = await request(app)
        .delete('/api/classes/class-1')
        .set('Authorization', `Bearer ${otherTeacherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Xem lớp của học sinh (Student)', () => {
    it('should retrieve list of joined classes for student', async () => {
      (prisma.classMember.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'member-1',
          class: { id: 'class-1', name: 'Lớp Tiếng Anh', teacher: { full_name: 'Thay B' } },
        },
      ]);

      const res = await request(app)
        .get('/api/classes/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });
});

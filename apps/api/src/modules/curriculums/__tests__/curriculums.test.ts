import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { normalizeVideoMetadata, sanitizeHtmlContent } from '../curriculums.service';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    class: {
      findUnique: jest.fn()
    },
    classMember: {
      findUnique: jest.fn()
    },
    classCurriculum: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    curriculumMaterial: {
      deleteMany: jest.fn(),
      createMany: jest.fn()
    },
    curriculumAssignment: {
      deleteMany: jest.fn(),
      createMany: jest.fn()
    },
    $transaction: jest.fn((callbackOrPromises) => {
      if (typeof callbackOrPromises === 'function') {
        return callbackOrPromises(prisma);
      }
      return Promise.all(callbackOrPromises);
    })
  }
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_1234567890123456';
const teacherId = 'a1111111-1111-4111-a111-111111111111';
const otherTeacherId = 'a2222222-2222-4222-a222-222222222222';
const studentId = 'b1111111-1111-4111-a111-111111111111';
const classId = 'c1111111-1111-4111-a111-111111111111';
const curriculumId = 'd1111111-1111-4111-a111-111111111111';

const teacherToken = jwt.sign({ userId: teacherId, role: 'teacher' }, JWT_SECRET);
const otherTeacherToken = jwt.sign({ userId: otherTeacherId, role: 'teacher' }, JWT_SECRET);
const studentToken = jwt.sign({ userId: studentId, role: 'student' }, JWT_SECRET);

describe('Curriculums Unit Helpers & API Test Suite (Section 4.2.3)', () => {
  describe('normalizeVideoMetadata', () => {
    it('should format Google Drive view link to preview embed format', () => {
      const result = normalizeVideoMetadata('https://drive.google.com/file/d/1A2B3C4D5E6F/view?usp=sharing');
      expect(result.normalizedUrl).toBe('https://drive.google.com/file/d/1A2B3C4D5E6F/preview');
      expect(result.videoType).toBe('drive');
    });

    it('should format YouTube watch link to embed format', () => {
      const result = normalizeVideoMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.normalizedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result.videoType).toBe('youtube');
    });

    it('should format Vimeo link to player embed format', () => {
      const result = normalizeVideoMetadata('https://vimeo.com/123456789');
      expect(result.normalizedUrl).toBe('https://player.vimeo.com/video/123456789');
      expect(result.videoType).toBe('vimeo');
    });

    it('should keep direct video links unchanged', () => {
      const result = normalizeVideoMetadata('https://my-bucket.s3.amazonaws.com/video.mp4');
      expect(result.normalizedUrl).toBe('https://my-bucket.s3.amazonaws.com/video.mp4');
      expect(result.videoType).toBe('direct');
    });
  });

  describe('sanitizeHtmlContent', () => {
    it('should strip malicious script tags and inline events', () => {
      const dirtyHtml = '<p>Hello</p><script>alert("hack")</script><img src="x" onerror="alert(1)" />';
      const clean = sanitizeHtmlContent(dirtyHtml);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onerror=');
      expect(clean).toContain('<p>Hello</p>');
    });
  });

  describe('Curriculums API Endpoints (TC_CLS_03 -> TC_CLS_06)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('TC_CLS_03: Thêm bài học mới vào lộ trình (POST)', () => {
      it('should allow teacher owner to create a curriculum item', async () => {
        (prisma.class.findUnique as jest.Mock).mockResolvedValue({
          id: classId,
          teacher_id: teacherId,
          is_active: true
        });
        (prisma.classCurriculum.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.classCurriculum.create as jest.Mock).mockResolvedValue({
          id: curriculumId,
          class_id: classId,
          title: 'Bài 1: Giới thiệu thì Hiện Tại Hoàn Thành',
          order_index: 0,
          materials: [],
          assignments: []
        });

        const res = await request(app)
          .post(`/api/classes/${classId}/curriculums`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            title: 'Bài 1: Giới thiệu thì Hiện Tại Hoàn Thành',
            content_html: '<p>Nội dung bài học</p>',
            video_url: 'https://drive.google.com/file/d/12345/view'
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(curriculumId);
      });

      it('should reject creation if teacher does not own the class (403)', async () => {
        (prisma.class.findUnique as jest.Mock).mockResolvedValue({
          id: classId,
          teacher_id: teacherId,
          is_active: true
        });

        const res = await request(app)
          .post(`/api/classes/${classId}/curriculums`)
          .set('Authorization', `Bearer ${otherTeacherToken}`)
          .send({
            title: 'Bài 1',
            content_html: '<p>Test</p>'
          });

        expect(res.status).toBe(403);
      });

      it('should reject creation from a student (403)', async () => {
        const res = await request(app)
          .post(`/api/classes/${classId}/curriculums`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            title: 'Bài 1',
            content_html: '<p>Test</p>'
          });

        expect(res.status).toBe(403);
      });
    });

    describe('GET /api/classes/:classId/curriculums', () => {
      it('should allow student member to list published curriculums', async () => {
        (prisma.class.findUnique as jest.Mock).mockResolvedValue({
          id: classId,
          is_active: true
        });
        (prisma.classMember.findUnique as jest.Mock).mockResolvedValue({
          class_id: classId,
          student_id: studentId,
          is_active: true
        });
        (prisma.classCurriculum.findMany as jest.Mock).mockResolvedValue([
          { id: curriculumId, title: 'Bài 1', is_published: true, order_index: 0, materials: [], assignments: [] }
        ]);

        const res = await request(app)
          .get(`/api/classes/${classId}/curriculums`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
      });
    });

    describe('TC_CLS_04: Sắp xếp lại thứ tự các bài học (PUT /reorder)', () => {
      it('should allow teacher owner to reorder curriculums', async () => {
        (prisma.class.findUnique as jest.Mock).mockResolvedValue({
          id: classId,
          teacher_id: teacherId,
          is_active: true
        });
        (prisma.classCurriculum.update as jest.Mock).mockResolvedValue({});
        (prisma.classCurriculum.findMany as jest.Mock).mockResolvedValue([
          { id: 'c2222222-2222-4222-a222-222222222222', order_index: 0 },
          { id: 'c1111111-1111-4111-a111-111111111111', order_index: 1 }
        ]);

        const res = await request(app)
          .put(`/api/classes/${classId}/curriculums/reorder`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            orders: [
              { id: 'c2222222-2222-4222-a222-222222222222', order_index: 0 },
              { id: 'c1111111-1111-4111-a111-111111111111', order_index: 1 }
            ]
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('TC_CLS_05: Đính kèm tài liệu học tập & Cập nhật bài học', () => {
      it('should allow teacher to update curriculum with attached materials', async () => {
        (prisma.class.findUnique as jest.Mock).mockResolvedValue({
          id: classId,
          teacher_id: teacherId,
          is_active: true
        });
        (prisma.classCurriculum.findUnique as jest.Mock).mockResolvedValue({
          id: curriculumId,
          class_id: classId,
        });
        (prisma.classCurriculum.update as jest.Mock).mockResolvedValue({
          id: curriculumId,
          title: 'Bài 1 (Cập nhật)',
          materials: [{ title: 'Slide bài giảng PDF', file_url: 'https://example.com/slide.pdf' }],
          assignments: []
        });

        const res = await request(app)
          .patch(`/api/classes/${classId}/curriculums/${curriculumId}`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            title: 'Bài 1 (Cập nhật)',
            materials: [
              { title: 'Slide bài giảng PDF', file_url: 'https://example.com/slide.pdf', file_type: 'pdf' }
            ]
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('TC_CLS_06: Xóa bài học khỏi lộ trình (DELETE)', () => {
      it('should allow teacher owner to delete curriculum item', async () => {
        (prisma.class.findUnique as jest.Mock).mockResolvedValue({
          id: classId,
          teacher_id: teacherId,
          is_active: true
        });
        (prisma.classCurriculum.findUnique as jest.Mock).mockResolvedValue({
          id: curriculumId,
          class_id: classId,
        });
        (prisma.classCurriculum.update as jest.Mock).mockResolvedValue({
          id: curriculumId,
          deleted_at: new Date()
        });

        const res = await request(app)
          .delete(`/api/classes/${classId}/curriculums/${curriculumId}`)
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });
});

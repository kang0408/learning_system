import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

describe('Admin Users CRUD Module (/api/users/admin)', () => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const adminId = 'admin-uuid-1234';
  const adminToken = jwt.sign({ userId: adminId, role: 'admin' }, secret);
  const studentToken = jwt.sign({ userId: 'student-uuid-5678', role: 'student' }, secret);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/admin/list', () => {
    it('should return 401 Unauthorized if no token provided', async () => {
      const res = await request(app).get('/api/users/admin/list');
      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden if non-admin role accesses admin route', async () => {
      const res = await request(app)
        .get('/api/users/admin/list')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 OK with paginated list for admin', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-1', email: 'user1@test.com', full_name: 'User One', role: 'student', is_active: true }
      ]);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/users/admin/list?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('POST /api/users/admin', () => {
    it('should return 400 Bad Request if email is invalid', async () => {
      const res = await request(app)
        .post('/api/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
          password: '123',
          full_name: 'Test Student',
          role: 'student',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 Bad Request if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-id', email: 'existing@test.com' });

      const res = await request(app)
        .post('/api/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'existing@test.com',
          password: 'Password123!',
          full_name: 'Existing User',
          role: 'student',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Email này đã được sử dụng');
    });

    it('should create user successfully as admin', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@test.com',
        full_name: 'New User',
        role: 'student',
        is_active: true,
        created_at: new Date(),
      });

      const res = await request(app)
        .post('/api/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          full_name: 'New User',
          role: 'student',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('new-user-id');
    });
  });

  describe('PATCH /api/users/admin/:id', () => {
    it('should return 400 Bad Request if Admin tries to deactivate their own account', async () => {
      const res = await request(app)
        .patch(`/api/users/admin/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot deactivate your own admin account');
    });

    it('should update user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'target-user-id', full_name: 'Old Name' });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'target-user-id',
        full_name: 'Updated Name',
        role: 'teacher',
        is_active: true,
      });

      const res = await request(app)
        .patch('/api/users/admin/target-user-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ full_name: 'Updated Name', role: 'teacher' });

      expect(res.status).toBe(200);
      expect(res.body.data.full_name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/users/admin/:id', () => {
    it('should return 400 Bad Request if Admin tries to delete their own account', async () => {
      const res = await request(app)
        .delete(`/api/users/admin/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot delete your own admin account');
    });

    it('should soft delete user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'target-user-id' });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'target-user-id',
        is_active: false,
        deleted_at: new Date(),
      });

      const res = await request(app)
        .delete('/api/users/admin/target-user-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_active).toBe(false);
    });
  });

  describe('POST /api/users/admin/:id/restore', () => {
    it('should restore soft-deleted user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'target-user-id' });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'target-user-id',
        is_active: true,
        deleted_at: null,
      });

      const res = await request(app)
        .post('/api/users/admin/target-user-id/restore')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_active).toBe(true);
    });
  });
});

import request from 'supertest';
import app from '../../../app';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/prisma';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    }
  }
}));

describe('Auth Middleware', () => {
  it('should reject without token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('should accept with valid token', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'uuid',
      email: 'test@test.com',
      full_name: 'Test Student',
      role: 'student',
      is_active: true,
      deleted_at: null,
    });

    const token = jwt.sign({ userId: 'uuid', role: 'student' }, process.env.JWT_SECRET || 'fallback_secret');
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@test.com');
  });
});

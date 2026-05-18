import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() }
  }
}));

describe('POST /api/auth/login', () => {
  it('should login successfully and return token', async () => {
    const hash = await bcrypt.hash('password123', 10);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'uuid',
      email: 'test@test.com',
      password_hash: hash,
      role: 'student'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@test.com',
      password: 'password123'
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

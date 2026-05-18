import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';

// Mock prisma client
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    }
  }
}));

describe('POST /api/auth/register', () => {
  it('should return 400 if validation fails', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('should register a new user successfully', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'uuid',
      email: 'test@test.com',
      full_name: 'Test User',
      role: 'student'
    });

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@test.com',
      password: 'password123',
      full_name: 'Test User',
      role: 'student'
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@test.com');
  });
});

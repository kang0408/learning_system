import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import { redisClient } from '../../../lib/redis';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    otpCode: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    }
  }
}));

jest.mock('../../../lib/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }
}));

describe('POST /api/auth/register', () => {
  it('should return 400 if validation fails', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('should register a new user successfully with verified OTP', async () => {
    (redisClient.get as jest.Mock).mockResolvedValue('123456');
    (prisma.otpCode.findFirst as jest.Mock).mockResolvedValue({
      id: 'otp-1',
      code: '123456',
      expires_at: new Date(Date.now() + 60000),
      is_used: false,
    });
    (prisma.otpCode.update as jest.Mock).mockResolvedValue({});
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
      role: 'student',
      code: '123456'
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('test@test.com');
  });
});

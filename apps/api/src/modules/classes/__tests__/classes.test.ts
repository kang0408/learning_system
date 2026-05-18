import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    class: { create: jest.fn(), findUnique: jest.fn() },
    classMember: { create: jest.fn() }
  }
}));

const teacherToken = jwt.sign({ userId: 'teacher-id', role: 'teacher' }, process.env.JWT_SECRET || 'fallback_secret');

describe('Classes Module', () => {
  it('should create a class (teacher)', async () => {
    (prisma.class.create as jest.Mock).mockResolvedValue({ id: 'class1', name: 'Math' });
    const res = await request(app).post('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Math', subject: 'Math', join_code: 'MATH123' });
    expect(res.status).toBe(201);
  });
});

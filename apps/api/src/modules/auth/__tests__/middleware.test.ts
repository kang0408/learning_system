import request from 'supertest';
import app from '../../../app';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  it('should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should accept with valid token', async () => {
    const token = jwt.sign({ userId: 'uuid', role: 'student' }, process.env.JWT_SECRET || 'fallback_secret');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

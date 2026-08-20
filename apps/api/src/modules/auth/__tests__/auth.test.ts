import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../../../lib/mailer', () => ({
  sendOTP: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    otpCode: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    class: {
      create: jest.fn(),
    },
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_1234567890123456';

describe('Auth & RBAC Test Suite (Section 4.2.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC_AUTH_01: Đăng ký tài khoản mới thành công', () => {
    it('should register a new user successfully with valid OTP and return 201', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.otpCode.findFirst as jest.Mock).mockResolvedValue({
        id: 'otp-1',
        email: 'student@test.com',
        code: '123456',
        purpose: 'register',
        is_used: false,
        expires_at: new Date(Date.now() + 60000),
      });
      (prisma.otpCode.update as jest.Mock).mockResolvedValue({ id: 'otp-1', is_used: true });
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: 'student@test.com',
        full_name: 'Nguyen Van A',
        role: 'student',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student@test.com',
          password: 'password123',
          full_name: 'Nguyen Van A',
          role: 'student',
          code: '123456',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('student@test.com');
      expect(res.body.data.user.role).toBe('student');
    });
  });

  describe('TC_AUTH_02: Đăng ký thất bại do trùng Email', () => {
    it('should return 400 when email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-id',
        email: 'student@test.com',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student@test.com',
          password: 'password123',
          full_name: 'Nguyen Van A',
          role: 'student',
          code: '123456',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already exists|đã tồn tại/i);
    });

    it('should return 400 when OTP code is invalid or expired', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.otpCode.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newstudent@test.com',
          password: 'password123',
          full_name: 'Nguyen Van B',
          role: 'student',
          code: '000000',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/OTP không hợp lệ/i);
    });
  });

  describe('TC_AUTH_03: Đăng nhập thành công', () => {
    it('should login successfully with correct credentials and return JWT token', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: 'student@test.com',
        password_hash: passwordHash,
        role: 'student',
        is_active: true,
        deleted_at: null,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('student@test.com');
      expect(res.body.data.user.role).toBe('student');
    });
  });

  describe('TC_AUTH_04: Đăng nhập thất bại do sai mật khẩu', () => {
    it('should return 401 when password is incorrect', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: 'student@test.com',
        password_hash: passwordHash,
        role: 'student',
        is_active: true,
        deleted_at: null,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid credentials|không chính xác/i);
    });

    it('should return 401 when user email does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('TC_AUTH_05: Truy cập tài nguyên yêu cầu xác thực', () => {
    it('should reject request without Bearer Token and return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    it('should accept request with valid token and return user profile', async () => {
      const token = jwt.sign({ userId: 'user-uuid-1', role: 'student' }, JWT_SECRET);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: 'student@test.com',
        full_name: 'Nguyen Van A',
        role: 'student',
      });

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('student@test.com');
    });
  });

  describe('TC_AUTH_06: Kiểm soát phân quyền theo vai trò (RBAC)', () => {
    it('should block Student from creating a class and return 403 Forbidden', async () => {
      const studentToken = jwt.sign({ userId: 'student-id', role: 'student' }, JWT_SECRET);

      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Lớp Tiếng Anh 10A1',
          subject: 'English',
        });

      expect(res.status).toBe(403);
    });

    it('should allow Teacher to create a class and return 201', async () => {
      const teacherToken = jwt.sign({ userId: 'teacher-id', role: 'teacher' }, JWT_SECRET);
      (prisma.class.create as jest.Mock).mockResolvedValue({
        id: 'class-1',
        name: 'Lớp Tiếng Anh 10A1',
        subject: 'English',
        teacher_id: 'teacher-id',
        join_code: 'ENG101',
      });

      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Lớp Tiếng Anh 10A1',
          subject: 'English',
        });

      expect(res.status).toBe(201);
    });
  });

  describe('Quy trình OTP & Quên/Đổi mật khẩu', () => {
    it('should send registration OTP for valid email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.otpCode.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.otpCode.create as jest.Mock).mockResolvedValue({ id: 'otp-1' });

      const res = await request(app)
        .post('/api/auth/register/send-otp')
        .send({ email: 'newstudent@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle forgot-password flow and generate reset token upon OTP verification', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'forgot@test.com',
      });
      (prisma.otpCode.findFirst as jest.Mock).mockResolvedValue({
        id: 'otp-2',
        email: 'forgot@test.com',
        code: '654321',
        purpose: 'forgot_password',
      });
      (prisma.otpCode.update as jest.Mock).mockResolvedValue({ id: 'otp-2', is_used: true });

      const verifyRes = await request(app)
        .post('/api/auth/verify-reset-otp')
        .send({ email: 'forgot@test.com', code: '654321' });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data).toHaveProperty('reset_token');
    });
  });
});

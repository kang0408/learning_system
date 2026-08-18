import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { AnalyticsController } from '../analytics.controller';
import { AnalyticsService } from '../analytics.service';
import { AnalyticsRepository } from '../analytics.repository';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    class: {
      count: jest.fn(),
    },
    question: {
      count: jest.fn(),
    },
    quizSession: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

describe('Admin System Analytics Module (/api/analytics/admin)', () => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const adminToken = jwt.sign({ userId: 'admin-uuid-1234', role: 'admin' }, secret);
  const studentToken = jwt.sign({ userId: 'student-uuid-5678', role: 'student' }, secret);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/admin/system', () => {
    it('should return 401 Unauthorized if no token provided', async () => {
      const res = await request(app).get('/api/analytics/admin/system');
      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden for non-admin user (student)', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/system')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('should return system metrics for admin with HEALTHY status', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(10);
      (prisma.user.groupBy as jest.Mock).mockResolvedValue([
        { role: 'student', _count: { id: 8 } },
        { role: 'admin', _count: { id: 2 } },
      ]);
      (prisma.class.count as jest.Mock).mockResolvedValue(3);
      (prisma.question.count as jest.Mock).mockResolvedValue(50);
      (prisma.quizSession.count as jest.Mock).mockResolvedValue(20);
      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ size: '100 MB' }])
        .mockResolvedValueOnce([{ count: BigInt(5) }]);

      const res = await request(app)
        .get('/api/analytics/admin/system')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('HEALTHY');
      expect(res.body.data.users.total).toBe(10);
      expect(res.body.data.database.databaseSize).toBe('100 MB');
      expect(res.body.data.server.memory).toBeDefined();
    });
  });

  describe('GET /api/analytics/admin/system/stream', () => {
    it('should return 403 Forbidden for non-admin on stream route', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/system/stream')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('should establish SSE Stream connection with text/event-stream header', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(10);
      (prisma.user.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.class.count as jest.Mock).mockResolvedValue(3);
      (prisma.question.count as jest.Mock).mockResolvedValue(50);
      (prisma.quizSession.count as jest.Mock).mockResolvedValue(20);
      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ size: '100 MB' }])
        .mockResolvedValueOnce([{ count: BigInt(5) }]);

      const req: any = { on: jest.fn() };
      const res: any = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      const repo = new AnalyticsRepository(prisma as any);
      const service = new AnalyticsService(repo, {} as any);
      const controller = new AnalyticsController(service);

      await controller.streamSystemAnalytics(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.write).toHaveBeenCalled();
    });
  });
});

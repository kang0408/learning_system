import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
router.get('/student/me', requireAuth, requireRole(['student']), AnalyticsController.getStudentStats);
export default router;

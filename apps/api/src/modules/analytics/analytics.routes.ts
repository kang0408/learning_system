import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
router.get('/student/me', requireAuth, requireRole(['student']), AnalyticsController.getStudentStats);
router.get('/teacher/classes/:classId', requireAuth, requireRole(['teacher']), AnalyticsController.getTeacherClassStats);
export default router;

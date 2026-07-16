import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

const analyticsRepository = new AnalyticsRepository(prisma);
const analyticsService = new AnalyticsService(analyticsRepository);
const analyticsController = new AnalyticsController(analyticsService);

// Student routes
router.get('/student/me', requireAuth, requireRole(['student']), asyncWrapper(analyticsController.getStudentStats));
router.get('/student/me/calendar', requireAuth, requireRole(['student']), asyncWrapper(analyticsController.getStudentCalendar));
router.get('/student/me/weak-topics', requireAuth, requireRole(['student']), asyncWrapper(analyticsController.getStudentWeakTopics));

// Teacher routes
router.get('/class/:classId', requireAuth, requireRole(['teacher']), asyncWrapper(analyticsController.getTeacherClassStats));
router.get('/class/:classId/topics', requireAuth, requireRole(['teacher']), asyncWrapper(analyticsController.getTeacherClassTopics));
router.get('/class/:classId/students', requireAuth, requireRole(['teacher']), asyncWrapper(analyticsController.getTeacherClassStudents));
router.get('/class/:classId/topics/:topicId/students', requireAuth, requireRole(['teacher']), asyncWrapper(analyticsController.getTeacherClassTopicStudents));
router.get('/student/:studentId', requireAuth, requireRole(['teacher']), asyncWrapper(analyticsController.getTeacherStudentStats));

// Parent routes
router.get('/parent/children', requireAuth, requireRole(['parent']), asyncWrapper(analyticsController.getParentChildren));
router.get('/parent/children/:studentId/weekly', requireAuth, requireRole(['parent']), asyncWrapper(analyticsController.getParentChildWeekly));

export default router;

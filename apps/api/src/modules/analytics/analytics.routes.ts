import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Student routes
router.get('/student/me', requireAuth, requireRole(['student']), AnalyticsController.getStudentStats);
router.get('/student/me/calendar', requireAuth, requireRole(['student']), AnalyticsController.getStudentCalendar);
router.get('/student/me/weak-topics', requireAuth, requireRole(['student']), AnalyticsController.getStudentWeakTopics);

// Teacher routes
router.get('/class/:classId', requireAuth, requireRole(['teacher']), AnalyticsController.getTeacherClassStats);
router.get('/class/:classId/topics', requireAuth, requireRole(['teacher']), AnalyticsController.getTeacherClassTopics);
router.get('/class/:classId/students', requireAuth, requireRole(['teacher']), AnalyticsController.getTeacherClassStudents);
router.get('/class/:classId/topics/:topicId/students', requireAuth, requireRole(['teacher']), AnalyticsController.getTeacherClassTopicStudents);
router.get('/student/:studentId', requireAuth, requireRole(['teacher']), AnalyticsController.getTeacherStudentStats);

// Parent routes
router.get('/parent/children', requireAuth, requireRole(['parent']), AnalyticsController.getParentChildren);
router.get('/parent/children/:studentId/weekly', requireAuth, requireRole(['parent']), AnalyticsController.getParentChildWeekly);

export default router;

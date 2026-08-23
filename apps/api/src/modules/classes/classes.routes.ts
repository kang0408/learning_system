import { Router } from 'express';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { ClassesRepository } from './classes.repository';
import { ClassReportService } from './class-report.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { AnalyticsRepository } from '../analytics/analytics.repository';
import { AiService } from '../ai/ai.service';
import { AiCacheRepository } from '../ai/ai-cache.repository';
import { AiRepository } from '../ai/ai.repository';
import redisClient from '../../lib/redis';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

const classesRepository = new ClassesRepository(prisma);
const classesService = new ClassesService(classesRepository);

const analyticsRepository = new AnalyticsRepository(prisma);
const aiCacheRepository = new AiCacheRepository();
const aiRepository = new AiRepository();
const aiService = new AiService(aiCacheRepository, aiRepository);

const classReportService = new ClassReportService(prisma, analyticsRepository, aiService);
const pdfGeneratorService = new PdfGeneratorService();

const classesController = new ClassesController(
  classesService,
  classReportService,
  pdfGeneratorService
);

// Teacher routes
router.post('/', requireAuth, requireRole(['teacher']), asyncWrapper(classesController.createClass));
router.get('/', requireAuth, requireRole(['teacher']), asyncWrapper(classesController.getTeacherClasses));

// Class Report routes (Must be before /:id generic param or specific)
router.get('/:id/report/pdf', requireAuth, requireRole(['teacher']), asyncWrapper(classesController.exportClassReportPdf));
router.get('/:id/report/data', requireAuth, requireRole(['teacher']), asyncWrapper(classesController.getClassReportData));

router.patch('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(classesController.updateClass));
router.delete('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(classesController.deleteClass));
router.get('/:id/members', requireAuth, requireRole(['teacher']), asyncWrapper(classesController.getClassMembers));
router.delete('/:id/members/:studentId', requireAuth, requireRole(['teacher']), asyncWrapper(classesController.removeMember));

// Student routes
router.post('/join', requireAuth, requireRole(['student']), asyncWrapper(classesController.joinClass));
router.get('/my', requireAuth, requireRole(['student']), asyncWrapper(classesController.getMyClasses));

// Mixed routes
router.get('/:id', requireAuth, requireRole(['teacher', 'student']), asyncWrapper(classesController.getClassById));

export default router;

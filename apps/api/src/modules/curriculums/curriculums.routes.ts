import { Router } from 'express';
import { CurriculumsController } from './curriculums.controller';
import { CurriculumsService } from './curriculums.service';
import { CurriculumsRepository } from './curriculums.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

const curriculumsRepository = new CurriculumsRepository(prisma);
const curriculumsService = new CurriculumsService(curriculumsRepository);
const curriculumsController = new CurriculumsController(curriculumsService);

// Reorder endpoint (Teacher only)
router.put('/reorder', requireAuth, requireRole(['teacher']), asyncWrapper(curriculumsController.reorderCurriculums));

// Base endpoints (Create by Teacher, List by Teacher & Student)
router.post('/', requireAuth, requireRole(['teacher']), asyncWrapper(curriculumsController.createCurriculum));
router.get('/', requireAuth, requireRole(['teacher', 'student']), asyncWrapper(curriculumsController.getCurriculumsByClass));

// Detail endpoints (Get by Teacher & Student, Update/Delete by Teacher)
router.get('/:id', requireAuth, requireRole(['teacher', 'student']), asyncWrapper(curriculumsController.getCurriculumById));
router.patch('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(curriculumsController.updateCurriculum));
router.delete('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(curriculumsController.deleteCurriculum));

export default router;

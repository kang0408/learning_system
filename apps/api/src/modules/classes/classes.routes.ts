import { Router } from 'express';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { ClassesRepository } from './classes.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

const classesRepository = new ClassesRepository(prisma);
const classesService = new ClassesService(classesRepository);
const classesController = new ClassesController(classesService);

// Teacher routes
router.post('/', requireAuth, requireRole(['teacher']), asyncWrapper(classesController.createClass));
router.get('/', requireAuth, requireRole(['teacher']), asyncWrapper(classesController.getTeacherClasses));
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

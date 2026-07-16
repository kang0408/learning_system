import { Router } from 'express';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { AssignmentsRepository } from './assignments.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

const assignmentsRepository = new AssignmentsRepository(prisma);
const assignmentsService = new AssignmentsService(assignmentsRepository);
const assignmentsController = new AssignmentsController(assignmentsService);

// Teacher routes
router.post('/', requireAuth, requireRole(['teacher']), asyncWrapper(assignmentsController.createAssignment));
router.get('/', requireAuth, requireRole(['teacher']), asyncWrapper(assignmentsController.getAssignments));
router.patch('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(assignmentsController.updateAssignment));
router.delete('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(assignmentsController.deleteAssignment));
router.post('/:id/publish', requireAuth, requireRole(['teacher']), asyncWrapper(assignmentsController.publishAssignment));
router.post('/:id/unpublish', requireAuth, requireRole(['teacher']), asyncWrapper(assignmentsController.unpublishAssignment));

// Student routes
router.get('/my', requireAuth, requireRole(['student']), asyncWrapper(assignmentsController.getMyAssignments));

// Mixed routes
router.get('/:id', requireAuth, requireRole(['teacher', 'student']), asyncWrapper(assignmentsController.getAssignmentById));

export default router;

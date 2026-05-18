import { Router } from 'express';
import { AssignmentsController } from './assignments.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Teacher routes
router.post('/', requireAuth, requireRole(['teacher']), AssignmentsController.createAssignment);
router.get('/', requireAuth, requireRole(['teacher']), AssignmentsController.getAssignments);
router.patch('/:id', requireAuth, requireRole(['teacher']), AssignmentsController.updateAssignment);
router.delete('/:id', requireAuth, requireRole(['teacher']), AssignmentsController.deleteAssignment);
router.post('/:id/publish', requireAuth, requireRole(['teacher']), AssignmentsController.publishAssignment);
router.post('/:id/unpublish', requireAuth, requireRole(['teacher']), AssignmentsController.unpublishAssignment);

// Student routes
router.get('/my', requireAuth, requireRole(['student']), AssignmentsController.getMyAssignments);

// Mixed routes
router.get('/:id', requireAuth, requireRole(['teacher', 'student']), AssignmentsController.getAssignmentById);

export default router;

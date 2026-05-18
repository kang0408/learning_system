import { Router } from 'express';
import { ClassesController } from './classes.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Teacher routes
router.post('/', requireAuth, requireRole(['teacher']), ClassesController.createClass);
router.get('/', requireAuth, requireRole(['teacher']), ClassesController.getTeacherClasses);
router.patch('/:id', requireAuth, requireRole(['teacher']), ClassesController.updateClass);
router.delete('/:id', requireAuth, requireRole(['teacher']), ClassesController.deleteClass);
router.get('/:id/members', requireAuth, requireRole(['teacher']), ClassesController.getClassMembers);
router.delete('/:id/members/:studentId', requireAuth, requireRole(['teacher']), ClassesController.removeMember);

// Student routes
router.post('/join', requireAuth, requireRole(['student']), ClassesController.joinClass);
router.get('/my', requireAuth, requireRole(['student']), ClassesController.getMyClasses);

// Mixed routes
router.get('/:id', requireAuth, requireRole(['teacher', 'student']), ClassesController.getClassById);

export default router;

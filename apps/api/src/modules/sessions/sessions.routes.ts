import { Router } from 'express';
import { SessionsController } from './sessions.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Standardized endpoints matching Phan 3 and Phan 6
router.post('/', requireAuth, requireRole(['student']), SessionsController.start);
router.post('/:id/answers', requireAuth, requireRole(['student']), SessionsController.submitAnswer);
router.post('/:id/finish', requireAuth, requireRole(['student']), SessionsController.finish);
router.post('/:id/abandon', requireAuth, requireRole(['student']), SessionsController.abandon);

router.get('/:id', requireAuth, requireRole(['student']), SessionsController.getInfo);
router.get('/:id/result', requireAuth, requireRole(['student']), SessionsController.getInfo);

export default router;

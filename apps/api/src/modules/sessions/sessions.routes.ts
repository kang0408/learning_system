import { Router } from 'express';
import { SessionsController } from './sessions.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
router.post('/start', requireAuth, requireRole(['student']), SessionsController.start);
router.post('/:sessionId/answer', requireAuth, requireRole(['student']), SessionsController.submitAnswer);
export default router;

import { Router } from 'express';
import { SessionsController } from './sessions.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
router.post('/start', requireAuth, requireRole(['student']), SessionsController.start);
export default router;

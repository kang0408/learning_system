import { Router } from 'express';
import { ParentController } from './parent.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
router.post('/link', requireAuth, requireRole(['parent']), ParentController.linkStudent);
router.get('/children', requireAuth, requireRole(['parent']), ParentController.getChildren);
export default router;

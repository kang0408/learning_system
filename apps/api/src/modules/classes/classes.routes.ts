import { Router } from 'express';
import { ClassesController } from './classes.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
router.post('/', requireAuth, requireRole(['teacher']), ClassesController.createClass);
export default router;

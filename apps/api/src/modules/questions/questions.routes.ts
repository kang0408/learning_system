import { Router } from 'express';
import { QuestionsController } from './questions.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
router.post('/', requireAuth, requireRole(['teacher']), QuestionsController.createQuestion);
export default router;

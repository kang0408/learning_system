import { Router } from 'express';
import { SM2Controller } from './sm2.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// M05: Schedule Generator API
router.get('/daily-schedule', requireAuth, requireRole(['student']), SM2Controller.getDailySchedule);

export default router;

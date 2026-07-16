import { Router } from 'express';
import { SM2Controller } from './sm2.controller';
import { SM2Service } from './sm2.service';
import { SM2Repository } from './sm2.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

const sm2Repository = new SM2Repository(prisma);
const sm2Service = new SM2Service(sm2Repository);
const sm2Controller = new SM2Controller(sm2Service);

// M05: Schedule Generator API
router.get('/daily-schedule', requireAuth, requireRole(['student']), asyncWrapper(sm2Controller.getDailySchedule));

export default router;

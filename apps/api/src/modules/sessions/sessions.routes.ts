import { Router } from 'express';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionsRepository } from './sessions.repository';
import { SM2Repository } from '../sm2/sm2.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

const sessionsRepository = new SessionsRepository(prisma);
const sm2Repository = new SM2Repository(prisma);
const sessionsService = new SessionsService(sessionsRepository, sm2Repository);
const sessionsController = new SessionsController(sessionsService);

// Standardized endpoints matching Phan 3 and Phan 6
router.post('/', requireAuth, requireRole(['student']), asyncWrapper(sessionsController.start));
router.post('/:id/answers', requireAuth, requireRole(['student']), asyncWrapper(sessionsController.submitAnswer));
router.post('/:id/finish', requireAuth, requireRole(['student']), asyncWrapper(sessionsController.finish));
router.post('/:id/abandon', requireAuth, requireRole(['student']), asyncWrapper(sessionsController.abandon));

router.get('/:id', requireAuth, requireRole(['student']), asyncWrapper(sessionsController.getInfo));
router.get('/:id/result', requireAuth, requireRole(['student']), asyncWrapper(sessionsController.getResult));

export default router;

import { Router } from 'express';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';
import { ParentRepository } from './parent.repository';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';

const router = Router();
const parentRepository = new ParentRepository(prisma);
const parentService = new ParentService(parentRepository);
const parentController = new ParentController(parentService);

router.post('/link', requireAuth, requireRole(['parent']), asyncWrapper(parentController.linkStudent));
router.get('/children', requireAuth, requireRole(['parent']), asyncWrapper(parentController.getChildren));
router.delete('/children/:studentId', requireAuth, requireRole(['parent']), asyncWrapper(parentController.unlinkStudent));

export default router;

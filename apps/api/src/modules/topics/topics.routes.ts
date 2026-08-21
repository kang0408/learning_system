import { Router } from 'express';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { TopicsRepository } from './topics.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

const topicsRepository = new TopicsRepository(prisma);
const topicsService = new TopicsService(topicsRepository);
const topicsController = new TopicsController(topicsService);

router.post('/', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.createTopic));
router.post('/batch-delete', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.batchDeleteTopics));
router.get('/', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.getTopics));
router.get('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.getTopicById));
router.put('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.updateTopic));
router.delete('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.deleteTopic));

export default router;

import { Router } from 'express';
import multer from 'multer';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { TopicsRepository } from './topics.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { AiService } from '../ai/ai.service';
import { AiRepository } from '../ai/ai.repository';
import { AiCacheRepository } from '../ai/ai-cache.repository';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const topicsRepository = new TopicsRepository(prisma);
const topicsService = new TopicsService(topicsRepository);

const aiCacheRepo = new AiCacheRepository();
const aiRepo = new AiRepository();
const aiService = new AiService(aiCacheRepo, aiRepo);

const topicsController = new TopicsController(topicsService, aiService);

router.post('/', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.createTopic));
router.post('/ai/generate-from-document', requireAuth, requireRole(['teacher']), upload.single('file'), asyncWrapper(topicsController.generateFromDocument));
router.post('/batch-delete', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.batchDeleteTopics));
router.get('/', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.getTopics));
router.get('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.getTopicById));
router.put('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.updateTopic));
router.delete('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(topicsController.deleteTopic));

export default router;

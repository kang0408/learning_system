import { Router } from 'express';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { AiService } from '../ai/ai.service';
import { AiRepository } from '../ai/ai.repository';
import { AiCacheRepository } from '../ai/ai-cache.repository';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const questionsRepository = new QuestionsRepository(prisma);
const questionsService = new QuestionsService(questionsRepository);

const aiCacheRepo = new AiCacheRepository();
const aiRepo = new AiRepository();
const aiService = new AiService(aiCacheRepo, aiRepo);

const questionsController = new QuestionsController(questionsService, aiService);

// Teacher routes
router.post('/', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.createQuestion));
router.get('/', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.getQuestions));
router.post('/bulk', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.bulkCreateQuestions));
router.post('/generate-ai', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.generateAiQuestions));
// CSV import route disabled
// router.post('/import', requireAuth, requireRole(['teacher']), upload.single('file'), asyncWrapper(questionsController.importCSV));
// Topic routes removed (moved to topics module)

// Question routes
router.get('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.getQuestionById));
router.put('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.updateQuestion));
router.patch('/:id/publish', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.togglePublish));
router.delete('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.deleteQuestion));

export default router;

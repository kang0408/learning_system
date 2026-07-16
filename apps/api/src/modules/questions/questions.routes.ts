import { Router } from 'express';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const questionsRepository = new QuestionsRepository(prisma);
const questionsService = new QuestionsService(questionsRepository);
const questionsController = new QuestionsController(questionsService);

// Teacher routes
router.post('/', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.createQuestion));
router.get('/', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.getQuestions));
// Note: topics endpoint removed since we use /topics now
router.post('/import', requireAuth, requireRole(['teacher']), upload.single('file'), asyncWrapper(questionsController.importCSV));
// Topic routes removed (moved to topics module)

// Question routes
router.get('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.getQuestionById));
router.put('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.updateQuestion));
router.patch('/:id/publish', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.togglePublish));
router.delete('/:id', requireAuth, requireRole(['teacher']), asyncWrapper(questionsController.deleteQuestion));

export default router;

import { Router } from 'express';
import { QuestionsController } from './questions.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Teacher routes
router.post('/', requireAuth, requireRole(['teacher']), QuestionsController.createQuestion);
router.get('/', requireAuth, requireRole(['teacher']), QuestionsController.getQuestions);
router.get('/topics', requireAuth, requireRole(['teacher']), QuestionsController.getTopics);
router.post('/import', requireAuth, requireRole(['teacher']), QuestionsController.importCSV);
router.get('/:id', requireAuth, requireRole(['teacher']), QuestionsController.getQuestionById);
router.put('/:id', requireAuth, requireRole(['teacher']), QuestionsController.updateQuestion);
router.delete('/:id', requireAuth, requireRole(['teacher']), QuestionsController.deleteQuestion);

export default router;

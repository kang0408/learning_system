import { Router } from 'express';
import { QuestionsController } from './questions.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Teacher routes
router.post('/', requireAuth, requireRole(['teacher']), QuestionsController.createQuestion);
router.get('/', requireAuth, requireRole(['teacher']), QuestionsController.getQuestions);
// Note: topics endpoint removed since we use /topics now
router.post('/import', requireAuth, requireRole(['teacher']), QuestionsController.importCSV);
// Topic routes
router.post('/topics', requireAuth, requireRole(['teacher']), QuestionsController.createTopic);
router.get('/topics', requireAuth, requireRole(['teacher']), QuestionsController.getTopics);
router.get('/topics/:id', requireAuth, requireRole(['teacher']), QuestionsController.getTopicById);
router.put('/topics/:id', requireAuth, requireRole(['teacher']), QuestionsController.updateTopic);
router.delete('/topics/:id', requireAuth, requireRole(['teacher']), QuestionsController.deleteTopic);

// Question routes
router.get('/:id', requireAuth, requireRole(['teacher']), QuestionsController.getQuestionById);
router.put('/:id', requireAuth, requireRole(['teacher']), QuestionsController.updateQuestion);
router.patch('/:id/publish', requireAuth, requireRole(['teacher']), QuestionsController.togglePublish);
router.delete('/:id', requireAuth, requireRole(['teacher']), QuestionsController.deleteQuestion);

export default router;

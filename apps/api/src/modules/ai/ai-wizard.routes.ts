import { Router } from 'express';
import multer from 'multer';
import { AiWizardController } from './ai-wizard.controller';
import { AiWizardService } from './ai-wizard.service';
import { AiWizardRepository } from './ai-wizard.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max file size
});

const router = Router();

const aiWizardService = new AiWizardService();
const aiWizardRepo = new AiWizardRepository();
const aiWizardController = new AiWizardController(aiWizardService, aiWizardRepo);

const teacherOrAdmin = [requireAuth, requireRole(['teacher', 'admin'])];

// 1. Get active draft (Auto-resume on refresh/reconnect)
router.get('/active-draft', teacherOrAdmin, asyncWrapper(aiWizardController.getActiveDraft));

// 2. Step 1: Upload document or text -> Extract curriculum outline
router.post('/step1-curriculum', teacherOrAdmin, upload.single('file'), asyncWrapper(aiWizardController.step1Curriculum));

// 3. Save / reorder draft lessons (Cards Drag & Drop and CRUD)
router.patch('/draft/lessons', teacherOrAdmin, asyncWrapper(aiWizardController.saveDraftLessons));

// 4. Server-Sent Events (SSE) Real-Time Progress Stream
router.get('/stream-progress', teacherOrAdmin, asyncWrapper(aiWizardController.streamProgress));

// 5. Step 2: Batch Generate Topics & Questions for Lessons
router.post('/step2-generate-content', teacherOrAdmin, asyncWrapper(aiWizardController.step2GenerateContent));

// 6. Update modal detail (Topics + Questions of a specific lesson)
router.patch('/draft/lesson-detail', teacherOrAdmin, asyncWrapper(aiWizardController.updateLessonDetail));

// 7. Regenerate a single question in Modal
router.post('/regenerate-question', teacherOrAdmin, asyncWrapper(aiWizardController.regenerateQuestion));

// 8. Commit entire wizard to database via Prisma Transaction
router.post('/commit', teacherOrAdmin, asyncWrapper(aiWizardController.commitWizard));

// 9. Discard active draft
router.delete('/draft', teacherOrAdmin, asyncWrapper(aiWizardController.deleteDraft));

export default router;
export { aiWizardController, aiWizardService, aiWizardRepo };

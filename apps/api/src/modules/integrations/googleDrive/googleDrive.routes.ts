import { Router } from 'express';
import multer from 'multer';
import { GoogleDriveController } from './googleDrive.controller';
import { GoogleDriveService } from './googleDrive.service';
import { asyncWrapper } from '../../../utils/asyncWrapper';
import { requireAuth, requireRole } from '../../../middlewares/auth.middleware';

const router = Router();

const googleDriveService = new GoogleDriveService();
const googleDriveController = new GoogleDriveController(googleDriveService);

// Multer memory storage for direct upload to Google Drive (supports files up to 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

// Google OAuth URL generator
router.get('/auth-url', requireAuth, requireRole(['teacher']), asyncWrapper(googleDriveController.getAuthUrl));

// Google OAuth redirect callback
router.get('/callback', asyncWrapper(googleDriveController.handleCallback));

// Status check (returns real storage quota & user details)
router.get('/status', requireAuth, requireRole(['teacher']), asyncWrapper(googleDriveController.getStatus));

// List files from Google Drive
router.get('/files', requireAuth, requireRole(['teacher']), asyncWrapper(googleDriveController.getFiles));

// Create a new folder
router.post('/folders', requireAuth, requireRole(['teacher']), asyncWrapper(googleDriveController.createFolder));

// Upload real file from computer
router.post(
  '/upload',
  requireAuth,
  requireRole(['teacher']),
  upload.single('file'),
  asyncWrapper(googleDriveController.uploadFile)
);

// Toggle file visibility (Public / Private)
router.post('/files/visibility', requireAuth, requireRole(['teacher']), asyncWrapper(googleDriveController.toggleVisibility));

// Delete a file or folder from Google Drive
router.delete('/files/:fileId', requireAuth, requireRole(['teacher']), asyncWrapper(googleDriveController.deleteFile));

// Disconnect
router.post('/disconnect', requireAuth, requireRole(['teacher']), asyncWrapper(googleDriveController.disconnect));

export default router;

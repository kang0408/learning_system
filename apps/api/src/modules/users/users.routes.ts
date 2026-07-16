import { Router } from 'express';
import { UsersController } from './users.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { uploadAvatarMiddleware } from '../../lib/upload';

const router = Router();

router.use(requireAuth);

router.get('/me', UsersController.getMe);
router.patch('/me', uploadAvatarMiddleware.single('avatar'), UsersController.updateMe);
router.patch('/me/password', UsersController.updatePassword);
router.post('/me/avatar', UsersController.uploadAvatar);

export default router;

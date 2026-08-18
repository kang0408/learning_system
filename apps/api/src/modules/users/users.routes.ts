import { Router } from 'express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { uploadAvatarMiddleware } from '../../lib/upload';

const router = Router();

const usersRepository = new UsersRepository(prisma);
const usersService = new UsersService(usersRepository);
const usersController = new UsersController(usersService);

router.use(requireAuth);

// Profile routes
router.get('/me', asyncWrapper(usersController.getMe));
router.patch('/me', uploadAvatarMiddleware.single('avatar'), asyncWrapper(usersController.updateMe));
router.post('/me/avatar', asyncWrapper(usersController.uploadAvatar));

// Admin User CRUD routes
router.get('/admin/list', requireRole(['admin']), asyncWrapper(usersController.getAdminUsers));
router.get('/admin/:id', requireRole(['admin']), asyncWrapper(usersController.getAdminUserDetail));
router.post('/admin', requireRole(['admin']), asyncWrapper(usersController.createAdminUser));
router.patch('/admin/:id', requireRole(['admin']), asyncWrapper(usersController.updateAdminUser));
router.patch('/admin/:id/password', requireRole(['admin']), asyncWrapper(usersController.resetUserPassword));
router.delete('/admin/:id', requireRole(['admin']), asyncWrapper(usersController.deleteAdminUser));
router.post('/admin/:id/restore', requireRole(['admin']), asyncWrapper(usersController.restoreAdminUser));

export default router;

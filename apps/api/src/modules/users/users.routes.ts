import { Router } from 'express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middlewares/auth.middleware';
import { uploadAvatarMiddleware } from '../../lib/upload';

const router = Router();

const usersRepository = new UsersRepository(prisma);
const usersService = new UsersService(usersRepository);
const usersController = new UsersController(usersService);

router.use(requireAuth);

router.get('/me', asyncWrapper(usersController.getMe));
router.patch('/me', uploadAvatarMiddleware.single('avatar'), asyncWrapper(usersController.updateMe));
router.post('/me/avatar', asyncWrapper(usersController.uploadAvatar));

export default router;

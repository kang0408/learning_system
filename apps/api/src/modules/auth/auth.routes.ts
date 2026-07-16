import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { requireAuth } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { prisma } from '../../lib/prisma';

const router = Router();

const authRepository = new AuthRepository(prisma);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

router.post('/register', asyncWrapper(authController.register));
router.post('/login', asyncWrapper(authController.login));

router.get('/me', requireAuth, (req: any, res) => {
  res.json({ success: true, data: { user: req.user } });
});

export default router;

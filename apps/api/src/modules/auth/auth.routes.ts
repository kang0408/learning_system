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

router.post('/register/send-otp', asyncWrapper(authController.sendRegistrationOtp));
router.post('/register', asyncWrapper(authController.register));
router.post('/login', asyncWrapper(authController.login));

router.post('/forgot-password', asyncWrapper(authController.forgotPassword));
router.post('/verify-reset-otp', asyncWrapper(authController.verifyResetOtp));
router.post('/reset-password', asyncWrapper(authController.resetPassword));

router.post('/change-password/send-otp', requireAuth, asyncWrapper(authController.sendChangePasswordOtp));
router.patch('/change-password', requireAuth, asyncWrapper(authController.changePassword));

export default router;

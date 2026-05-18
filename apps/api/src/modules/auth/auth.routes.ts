import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Add this route for testing middleware
router.get('/me', requireAuth, (req: any, res) => {
  res.json({ user: req.user });
});

export default router;

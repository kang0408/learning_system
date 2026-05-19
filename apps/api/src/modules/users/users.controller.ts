import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { updateMeSchema, updatePasswordSchema } from './users.schema';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class UsersController {
  static async getMe(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    
    try {
      const user = await UsersService.getMe(req.user.userId);
      res.json({ success: true, data: user });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  }

  static async updateMe(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    
    const parseResult = updateMeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parseResult.error.issues } });
    }

    try {
      const user = await UsersService.updateMe(req.user.userId, parseResult.data);
      res.json({ success: true, data: user });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  }

  static async updatePassword(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const parseResult = updatePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parseResult.error.issues } });
    }

    try {
      await UsersService.updatePassword(req.user.userId, parseResult.data);
      res.json({ success: true, data: {} });
    } catch (err: any) {
      const code = err.status === 401 ? 'UNAUTHORIZED' : err.status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR';
      res.status(err.status || 500).json({ success: false, error: { code, message: err.message } });
    }
  }

  static async uploadAvatar(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const avatarUrl = req.body.avatar_url;
    if (!avatarUrl) {
       return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'avatar_url is required' } });
    }

    try {
      const user = await UsersService.uploadAvatar(req.user.userId, avatarUrl);
      res.json({ success: true, data: user });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  }
}

import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { updateMeSchema, updatePasswordSchema } from './users.schema';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { BaseController } from '../../controllers/BaseController';
import { ApiError } from '../../lib/ApiError';

export class UsersController extends BaseController {
  constructor(private readonly usersService: UsersService) {
    super();
    this.getMe = this.getMe.bind(this);
    this.updateMe = this.updateMe.bind(this);
    this.uploadAvatar = this.uploadAvatar.bind(this);
  }

  async getMe(req: AuthRequest, res: Response) {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    
    const user = await this.usersService.getMe(req.user.userId);
    this.handleSuccess(res, user);
  }

  async updateMe(req: AuthRequest, res: Response) {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    
    const parseResult = updateMeSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, 'Dữ liệu không hợp lệ');
    }

    const updateData: any = { ...parseResult.data };
    
    if (req.file) {
      updateData.avatar_url = `/public/uploads/avatars/${req.file.filename}`;
      
      // Delete old avatar if it exists
      const currentUser = await this.usersService.getMe(req.user.userId);
      if (currentUser.avatar_url && currentUser.avatar_url.startsWith('/public/uploads/')) {
        const fs = require('fs');
        const path = require('path');
        const oldPath = path.join(process.cwd(), currentUser.avatar_url);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {
            console.error('Failed to delete old avatar:', e);
          }
        }
      }
    }

    const user = await this.usersService.updateMe(req.user.userId, updateData);
    this.handleSuccess(res, user);
  }



  async uploadAvatar(req: AuthRequest, res: Response) {
    if (!req.user) throw new ApiError(401, 'Unauthorized');

    const avatarUrl = req.body.avatar_url;
    if (!avatarUrl) {
      throw new ApiError(400, 'avatar_url is required');
    }

    const user = await this.usersService.uploadAvatar(req.user.userId, avatarUrl);
    this.handleSuccess(res, user);
  }
}

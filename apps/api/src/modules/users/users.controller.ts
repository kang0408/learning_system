import { Request, Response } from 'express';
import { UsersService } from './users.service';
import {
  updateMeSchema,
  adminListUsersQuerySchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminResetPasswordSchema,
} from './users.schema';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { BaseController } from '../../controllers/BaseController';
import { ApiError } from '../../lib/ApiError';

export class UsersController extends BaseController {
  constructor(private readonly usersService: UsersService) {
    super();
    this.getMe = this.getMe.bind(this);
    this.updateMe = this.updateMe.bind(this);
    this.uploadAvatar = this.uploadAvatar.bind(this);

    // Bind Admin Controllers
    this.getAdminUsers = this.getAdminUsers.bind(this);
    this.getAdminUserDetail = this.getAdminUserDetail.bind(this);
    this.createAdminUser = this.createAdminUser.bind(this);
    this.updateAdminUser = this.updateAdminUser.bind(this);
    this.resetUserPassword = this.resetUserPassword.bind(this);
    this.deleteAdminUser = this.deleteAdminUser.bind(this);
    this.restoreAdminUser = this.restoreAdminUser.bind(this);
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

  // --- Admin Controllers ---

  async getAdminUsers(req: AuthRequest, res: Response) {
    const parseResult = adminListUsersQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      throw new ApiError(400, 'Tham số tìm kiếm không hợp lệ');
    }

    const result = await this.usersService.getAdminUsersList(parseResult.data);
    this.handleSuccess(res, result.items, 200, result.pagination);
  }

  async getAdminUserDetail(req: AuthRequest, res: Response) {
    const id = req.params.id as string;
    const user = await this.usersService.getAdminUserDetail(id);
    this.handleSuccess(res, user);
  }

  async createAdminUser(req: AuthRequest, res: Response) {
    const parseResult = adminCreateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || 'Dữ liệu người dùng không hợp lệ';
      throw new ApiError(400, errorMsg);
    }

    const user = await this.usersService.adminCreateUser(parseResult.data);
    this.handleSuccess(res, user, 201);
  }

  async updateAdminUser(req: AuthRequest, res: Response) {
    if (!req.user) throw new ApiError(401, 'Unauthorized');

    const id = req.params.id as string;
    const parseResult = adminUpdateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, 'Dữ liệu cập nhật không hợp lệ');
    }

    const user = await this.usersService.adminUpdateUser(id, req.user.userId, parseResult.data);
    this.handleSuccess(res, user);
  }

  async resetUserPassword(req: AuthRequest, res: Response) {
    const id = req.params.id as string;
    const parseResult = adminResetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || 'Mật khẩu mới không hợp lệ';
      throw new ApiError(400, errorMsg);
    }

    const user = await this.usersService.adminResetPassword(id, parseResult.data.new_password);
    this.handleSuccess(res, user);
  }

  async deleteAdminUser(req: AuthRequest, res: Response) {
    if (!req.user) throw new ApiError(401, 'Unauthorized');

    const id = req.params.id as string;
    const user = await this.usersService.adminDeleteUser(id, req.user.userId);
    this.handleSuccess(res, user);
  }

  async restoreAdminUser(req: AuthRequest, res: Response) {
    const id = req.params.id as string;
    const user = await this.usersService.adminRestoreUser(id);
    this.handleSuccess(res, user);
  }
}

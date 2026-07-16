import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema, sendOtpSchema, forgotPasswordSchema, resetPasswordSchema, verifyResetOtpSchema, changePasswordSchema } from './auth.schema';
import { BaseController } from '../../controllers/BaseController';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { ApiError } from '../../lib/ApiError';

export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.sendRegistrationOtp = this.sendRegistrationOtp.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.verifyResetOtp = this.verifyResetOtp.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.sendChangePasswordOtp = this.sendChangePasswordOtp.bind(this);
    this.changePassword = this.changePassword.bind(this);
  }

  async sendRegistrationOtp(req: Request, res: Response) {
    const data = sendOtpSchema.parse(req.body);
    const result = await this.authService.sendRegistrationOtp(data);
    this.handleSuccess(res, result);
  }

  async register(req: Request, res: Response) {
    const data = registerSchema.parse(req.body);
    const user = await this.authService.register(data);
    this.handleSuccess(res, { user }, 201);
  }

  async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);
    const result = await this.authService.login(data);
    this.handleSuccess(res, result);
  }

  async forgotPassword(req: Request, res: Response) {
    const data = forgotPasswordSchema.parse(req.body);
    const result = await this.authService.forgotPassword(data);
    this.handleSuccess(res, result);
  }

  async verifyResetOtp(req: Request, res: Response) {
    const data = verifyResetOtpSchema.parse(req.body);
    const result = await this.authService.verifyResetOtp(data);
    this.handleSuccess(res, result);
  }

  async resetPassword(req: Request, res: Response) {
    const data = resetPasswordSchema.parse(req.body);
    const result = await this.authService.resetPassword(data);
    this.handleSuccess(res, result);
  }

  async sendChangePasswordOtp(req: AuthRequest, res: Response) {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    const result = await this.authService.sendChangePasswordOtp(req.user.userId);
    this.handleSuccess(res, result);
  }

  async changePassword(req: AuthRequest, res: Response) {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    const data = changePasswordSchema.parse(req.body);
    const result = await this.authService.changePassword(req.user.userId, data);
    this.handleSuccess(res, result);
  }
}

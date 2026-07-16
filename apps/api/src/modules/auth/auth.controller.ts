import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from './auth.schema';
import { BaseController } from '../../controllers/BaseController';

export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
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
}

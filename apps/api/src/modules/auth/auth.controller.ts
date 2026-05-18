import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema } from './auth.schema';

export class AuthController {
  static async register(req: Request, res: Response) {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error });
    }
    
    const user = await AuthService.register(parseResult.data);
    res.status(201).json({ user });
  }
}

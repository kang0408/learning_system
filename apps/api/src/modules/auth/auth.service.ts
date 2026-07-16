import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { config } from '../../config';
import { ApiError } from '../../lib/ApiError';

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(data: any) {
    const existing = await this.authRepository.findUserByEmail(data.email);
    if (existing) {
      throw new ApiError(400, 'Email already exists');
    }
    
    const password_hash = await bcrypt.hash(data.password, 10);
    
    const user = await this.authRepository.createUser({
      ...data,
      password_hash
    });
    
    return user;
  }

  async login(data: any) {
    const user = await this.authRepository.findUserByEmail(data.email);
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }
    
    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) {
      throw new ApiError(401, 'Invalid credentials');
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      config.auth.jwtSecret, 
      { expiresIn: '7d' }
    );
    
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }
}

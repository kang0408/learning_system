import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

export class AuthService {
  static async register(data: any) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw { status: 400, message: 'Email already exists' };
    }
    
    const password_hash = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash,
        full_name: data.full_name,
        role: data.role
      },
      select: { id: true, email: true, full_name: true, role: true }
    });
    
    return user;
  }

  static async login(data: any) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw { status: 401, message: 'Invalid credentials' };
    
    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) throw { status: 401, message: 'Invalid credentials' };
    
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '7d' });
    
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }
}

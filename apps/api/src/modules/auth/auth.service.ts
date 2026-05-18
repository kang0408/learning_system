import bcrypt from 'bcrypt';
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
}

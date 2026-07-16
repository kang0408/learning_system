import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';

export class UsersService {
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        address: true,
        role: true,
        avatar_url: true,
        is_active: true,
        created_at: true,
      },
    });
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    return user;
  }

  static async updateMe(userId: string, data: { full_name?: string; phone?: string; address?: string; avatar_url?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        address: true,
        role: true,
        avatar_url: true,
        is_active: true,
        created_at: true,
      },
    });
    return user;
  }

  static async updatePassword(userId: string, data: any) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const isValid = await bcrypt.compare(data.old_password, user.password_hash);
    if (!isValid) {
      throw { status: 401, message: 'Mật khẩu cũ không chính xác' };
    }

    const password_hash = await bcrypt.hash(data.new_password, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });

    return { success: true };
  }

  static async uploadAvatar(userId: string, avatar_url: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar_url },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        avatar_url: true,
        is_active: true,
        created_at: true,
      },
    });
    return user;
  }
}

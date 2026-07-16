import bcrypt from 'bcrypt';
import { ApiError } from '../../lib/ApiError';
import { UsersRepository } from './users.repository';
import { sendOTP } from '../../lib/mailer';

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(userId: string) {
    const user = await this.usersRepository.findUserById(userId, {
      id: true,
      email: true,
      full_name: true,
      phone: true,
      address: true,
      role: true,
      avatar_url: true,
      is_active: true,
      created_at: true,
    });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  async updateMe(userId: string, data: { full_name?: string; phone?: string; address?: string; avatar_url?: string }) {
    const user = await this.usersRepository.updateUser(userId, data, {
      id: true,
      email: true,
      full_name: true,
      phone: true,
      address: true,
      role: true,
      avatar_url: true,
      is_active: true,
      created_at: true,
    });
    return user;
  }



  async uploadAvatar(userId: string, avatar_url: string) {
    const user = await this.usersRepository.updateUser(userId, { avatar_url }, {
      id: true,
      email: true,
      full_name: true,
      role: true,
      avatar_url: true,
      is_active: true,
      created_at: true,
    });
    return user;
  }
}

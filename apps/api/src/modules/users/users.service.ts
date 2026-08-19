import bcrypt from 'bcrypt';
import { ApiError } from '../../lib/ApiError';
import { UsersRepository } from './users.repository';

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

  // --- Admin User CRUD Services ---

  async getAdminUsersList(query: { page?: number; limit?: number; role?: string; is_active?: boolean; search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.usersRepository.findUsersPaginated({
      skip,
      take: limit,
      role: query.role,
      is_active: query.is_active,
      search: query.search,
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminUserDetail(id: string) {
    const user = await this.usersRepository.findUserDetailById(id);
    if (!user) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }
    return user;
  }

  async adminCreateUser(data: { email: string; password: string; full_name: string; role: 'student' | 'teacher' | 'parent' | 'admin'; phone?: string; address?: string }) {
    const existing = await this.usersRepository.findByEmail(data.email);
    if (existing) {
      throw new ApiError(400, 'Email này đã được sử dụng');
    }

    const password_hash = await bcrypt.hash(data.password, 10);
    return this.usersRepository.createUser({
      email: data.email,
      password_hash,
      full_name: data.full_name,
      role: data.role,
      phone: data.phone,
      address: data.address,
      is_active: true,
    });
  }

  async adminUpdateUser(id: string, currentAdminId: string, data: { full_name?: string; role?: string; is_active?: boolean; phone?: string; address?: string }) {
    if (id === currentAdminId && data.is_active === false) {
      throw new ApiError(400, 'Cannot deactivate your own admin account');
    }

    const existing = await this.usersRepository.findUserById(id);
    if (!existing) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }

    return this.usersRepository.updateUser(id, data);
  }

  async adminResetPassword(id: string, newPassword: string) {
    const existing = await this.usersRepository.findUserById(id);
    if (!existing) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    return this.usersRepository.updateUser(id, { password_hash });
  }

  async adminDeleteUser(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new ApiError(400, 'Cannot delete your own admin account');
    }

    const existing = await this.usersRepository.findUserById(id);
    if (!existing) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }

    return this.usersRepository.softDeleteUser(id);
  }

  async adminRestoreUser(id: string) {
    const existing = await this.usersRepository.findUserById(id);
    if (!existing) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }

    return this.usersRepository.restoreUser(id);
  }

  async adminHardDeleteUser(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new ApiError(400, 'Không thể xóa vĩnh viễn tài khoản Admin của chính mình');
    }

    const existing = await this.usersRepository.findUserById(id);
    if (!existing) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }

    try {
      return await this.usersRepository.hardDeleteUser(id);
    } catch (err: any) {
      if (err.code === 'P2003') {
        throw new ApiError(400, 'Không thể xóa vĩnh viễn người dùng này vì họ đang sở hữu dữ liệu liên quan (Lớp học, Câu hỏi, Bài tập, Chủ đề). Hãy chuyển quyền hoặc xóa dữ liệu liên quan trước.');
      }
      throw err;
    }
  }
}

import { z } from 'zod';

export const updateMeSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const adminListUsersQuerySchema = z.object({
  page: z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => (v ? parseInt(v, 10) : 10)),
  role: z.enum(['student', 'teacher', 'parent', 'admin']).optional(),
  is_active: z.enum(['true', 'false']).optional().transform(v => (v === undefined ? undefined : v === 'true')),
  search: z.string().optional(),
});

export const adminCreateUserSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  full_name: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  role: z.enum(['student', 'teacher', 'parent', 'admin']),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const adminUpdateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  role: z.enum(['student', 'teacher', 'parent', 'admin']).optional(),
  is_active: z.boolean().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const adminResetPasswordSchema = z.object({
  new_password: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

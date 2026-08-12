import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  role: z.enum(['student', 'teacher']),
  code: z.string().length(6, 'Mã OTP phải bao gồm 6 chữ số')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const sendOtpSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Mã OTP phải bao gồm 6 chữ số')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const verifyResetOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

export const resetPasswordSchema = z.object({
  reset_token: z.string(),
  new_password: z.string().min(6)
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Old password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  code: z.string().length(6, 'Mã OTP phải bao gồm 6 chữ số')
});


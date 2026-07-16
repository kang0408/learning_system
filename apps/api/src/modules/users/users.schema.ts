import { z } from 'zod';

export const updateMeSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  old_password: z.string().min(1, 'Old password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
});

import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(1, 'Tên lớp là bắt buộc'),
  subject: z.string().min(1, 'Môn học là bắt buộc'),
  description: z.string().optional()
});

export const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  description: z.string().optional()
});

export const joinClassSchema = z.object({
  join_code: z.string().min(1, 'Mã lớp là bắt buộc')
});

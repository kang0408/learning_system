import { z } from 'zod';

export const createTopicSchema = z.object({
  name: z.string().min(1, 'Tiêu đề là bắt buộc'),
  description: z.string().nullable().optional(),
  code: z.string().length(6, 'Mã topic phải chứa đúng 6 ký tự').nullable().optional(),
  parent_id: z.string().uuid().nullable().optional()
});

export const updateTopicSchema = z.object({
  name: z.string().min(1, 'Tiêu đề là bắt buộc').optional(),
  description: z.string().nullable().optional(),
  code: z.string().length(6, 'Mã topic phải chứa đúng 6 ký tự').nullable().optional(),
  parent_id: z.string().uuid().nullable().optional()
});

import { z } from 'zod';

export const createTopicSchema = z.object({
  name: z.string().min(1, 'Tiêu đề là bắt buộc'),
  description: z.string().optional(),
  code: z.string().length(6, 'Mã topic phải chứa đúng 6 ký tự').optional(),
  parent_id: z.string().uuid().optional()
});

export const updateTopicSchema = createTopicSchema;

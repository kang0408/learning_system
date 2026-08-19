import { z } from 'zod';

export const curriculumMaterialSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Tiêu đề tài liệu không được để trống').max(200),
  file_url: z.string().min(1, 'URL tài liệu không được để trống'),
  file_type: z.string().max(50).optional().nullable(),
  file_size: z.number().int().nonnegative().optional().nullable(),
  order_index: z.number().int().min(0).optional().default(0)
});

export const createCurriculumSchema = z.object({
  title: z.string().min(1, 'Tiêu đề bài học không được để trống').max(200),
  content_html: z.string().min(1, 'Nội dung bài học không được để trống'),
  video_url: z.string().max(500).optional().nullable(),
  video_type: z.enum(['youtube', 'drive', 'vimeo', 'direct', 'embed']).optional().nullable(),
  is_published: z.boolean().optional().default(true),
  materials: z.array(curriculumMaterialSchema).optional().default([]),
  assignment_ids: z.array(z.string().uuid('ID bài tập không hợp lệ')).optional().default([])
});

export const updateCurriculumSchema = z.object({
  title: z.string().min(1, 'Tiêu đề bài học không được để trống').max(200).optional(),
  content_html: z.string().min(1, 'Nội dung bài học không được để trống').optional(),
  video_url: z.string().max(500).optional().nullable(),
  video_type: z.enum(['youtube', 'drive', 'vimeo', 'direct', 'embed']).optional().nullable(),
  is_published: z.boolean().optional(),
  materials: z.array(curriculumMaterialSchema).optional(),
  assignment_ids: z.array(z.string().uuid('ID bài tập không hợp lệ')).optional()
});

export const reorderCurriculumsSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string().uuid('ID bài học không hợp lệ'),
      order_index: z.number().int().min(0, 'Thứ tự không hợp lệ')
    })
  ).min(1, 'Danh sách sắp xếp không được để trống')
});

export type CreateCurriculumInput = z.infer<typeof createCurriculumSchema>;
export type UpdateCurriculumInput = z.infer<typeof updateCurriculumSchema>;
export type ReorderCurriculumsInput = z.infer<typeof reorderCurriculumsSchema>;

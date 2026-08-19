import api from '@/api/axios';
import type {
  ClassCurriculum,
  CreateCurriculumPayload,
  UpdateCurriculumPayload,
  ReorderCurriculumItem
} from '../types/curriculum.types';

export const teacherCurriculumApi = {
  getCurriculums: async (classId: string): Promise<ClassCurriculum[]> => {
    const res = await api.get(`/api/classes/${classId}/curriculums`);
    return res.data.data || [];
  },

  getCurriculumById: async (classId: string, id: string): Promise<ClassCurriculum> => {
    const res = await api.get(`/api/classes/${classId}/curriculums/${id}`);
    return res.data.data;
  },

  createCurriculum: async (classId: string, payload: CreateCurriculumPayload): Promise<ClassCurriculum> => {
    const res = await api.post(`/api/classes/${classId}/curriculums`, payload);
    return res.data.data;
  },

  updateCurriculum: async (classId: string, id: string, payload: UpdateCurriculumPayload): Promise<ClassCurriculum> => {
    const res = await api.patch(`/api/classes/${classId}/curriculums/${id}`, payload);
    return res.data.data;
  },

  deleteCurriculum: async (classId: string, id: string): Promise<void> => {
    await api.delete(`/api/classes/${classId}/curriculums/${id}`);
  },

  reorderCurriculums: async (classId: string, orders: ReorderCurriculumItem[]): Promise<ClassCurriculum[]> => {
    const res = await api.put(`/api/classes/${classId}/curriculums/reorder`, { orders });
    return res.data.data || [];
  }
};

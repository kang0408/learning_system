import api from '@/api/axios';
import type { StudentCurriculum } from '../types/curriculum.types';

export const studentCurriculumApi = {
  getCurriculums: async (classId: string): Promise<StudentCurriculum[]> => {
    const res = await api.get(`/api/classes/${classId}/curriculums`);
    return res.data?.data || [];
  },

  getCurriculumById: async (classId: string, id: string): Promise<StudentCurriculum> => {
    const res = await api.get(`/api/classes/${classId}/curriculums/${id}`);
    return res.data?.data;
  }
};

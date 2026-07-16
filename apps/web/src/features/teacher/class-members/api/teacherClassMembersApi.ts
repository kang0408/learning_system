import api from '@/api/axios';
import type { GetMembersResponse } from '../types';

export const teacherClassMembersApi = {
  getMembers: async (classId: string, page: number, limit: number = 20): Promise<GetMembersResponse> => {
    const res = await api.get(`/api/classes/${classId}/members?page=${page}&limit=${limit}`);
    return {
      data: res.data.data || [],
      meta: res.data.meta || { total: 0, page, limit }
    };
  },

  removeMember: async (classId: string, studentId: string): Promise<void> => {
    await api.delete(`/api/classes/${classId}/members/${studentId}`);
  }
};

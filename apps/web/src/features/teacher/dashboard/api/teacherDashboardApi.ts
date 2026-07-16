import api from '@/api/axios';
import type { TeacherClassItem, CreateClassPayload } from '../types';

export const teacherDashboardApi = {
  getClasses: async (): Promise<TeacherClassItem[]> => {
    const res = await api.get('/api/classes');
    return res.data.data || res.data;
  },

  createClass: async (payload: CreateClassPayload): Promise<TeacherClassItem> => {
    const res = await api.post('/api/classes', payload);
    return res.data.data || res.data;
  }
};

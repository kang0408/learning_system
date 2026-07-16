import api from '@/api/axios';
import type { ClassItem, JoinClassPayload } from '../types';

export const studentClassesApi = {
  getMyClasses: async (): Promise<ClassItem[]> => {
    const res = await api.get('/api/classes/my');
    return res.data?.data || res.data;
  },
  
  joinClass: async (payload: JoinClassPayload): Promise<void> => {
    await api.post('/api/classes/join', payload);
  }
};

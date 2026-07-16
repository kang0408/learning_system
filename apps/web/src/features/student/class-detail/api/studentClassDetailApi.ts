import api from '@/api/axios';
import type { ClassDetailData, AssignmentItem } from '../types';

export const studentClassDetailApi = {
  getClassDetail: async (id: string): Promise<ClassDetailData> => {
    // We fetch all classes and find the current one as per existing logic
    const res = await api.get('/api/classes/my');
    const myClasses = res.data?.data || res.data;
    const currentMembership = myClasses.find((c: any) => c.class_id === id);
    
    if (!currentMembership) {
      throw new Error('Class not found');
    }
    
    return currentMembership.class || currentMembership;
  },

  getClassAssignments: async (id: string): Promise<AssignmentItem[]> => {
    const res = await api.get(`/api/assignments/my?class_id=${id}&status=all`);
    return res.data?.data || res.data;
  }
};

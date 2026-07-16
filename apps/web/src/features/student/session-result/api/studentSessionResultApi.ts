import api from '@/api/axios';
import type { ResultData } from '../types';

export const studentSessionResultApi = {
  getResult: async (sessionId: string): Promise<ResultData> => {
    const res = await api.get(`/api/sessions/${sessionId}/result`);
    return res.data?.data || res.data;
  }
};

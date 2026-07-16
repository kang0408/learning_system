import api from '@/api/axios';
import type { Session, AnswerPayload, AnswerResponse } from '../types';

export const studentQuizApi = {
  initSession: async (assignmentId: string): Promise<Session> => {
    const res = await api.post('/api/sessions', { assignment_id: assignmentId });
    const data = res.data?.data || res.data;
    return {
      id: data.session_id,
      status: 'in_progress',
      assignment_id: assignmentId,
      time_limit_seconds: data.time_limit_seconds,
      questions: data.questions || []
    };
  },

  submitAnswer: async (sessionId: string, payload: AnswerPayload): Promise<AnswerResponse> => {
    const res = await api.post(`/api/sessions/${sessionId}/answers`, payload);
    return res.data?.data || res.data;
  },

  finishSession: async (sessionId: string): Promise<any> => {
    const res = await api.post(`/api/sessions/${sessionId}/finish`);
    return res.data?.data || res.data;
  }
};

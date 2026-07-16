import api from '@/api/axios';
import type { Topic, Question, ClassMember, CreateAssignmentPayload } from '../types';

export const teacherNewAssignmentApi = {
  getInitialData: async (classId: string) => {
    const [topicsRes, membersRes] = await Promise.all([
      api.get('/api/topics'),
      api.get(`/api/classes/${classId}/members?limit=1000`)
    ]);

    return {
      topics: (topicsRes.data.data || []) as Topic[],
      members: (membersRes.data.data || []) as ClassMember[]
    };
  },

  getTopicQuestions: async (topicId: string): Promise<Question[]> => {
    const res = await api.get(`/api/topics/${topicId}`);
    return res.data.data.questions || [];
  },

  createAssignment: async (payload: CreateAssignmentPayload): Promise<void> => {
    await api.post('/api/assignments', payload);
  }
};

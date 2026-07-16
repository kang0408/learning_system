import api from '@/api/axios';
import type { Assignment, Topic, Question, ClassMember, UpdateAssignmentPayload } from '../types';

export const teacherEditAssignmentApi = {
  getInitialData: async (classId: string, assignmentId: string) => {
    const [topicsRes, assignRes, membersRes] = await Promise.all([
      api.get('/api/questions/topics'),
      api.get(`/api/assignments/${assignmentId}`),
      api.get(`/api/classes/${classId}/members?limit=1000`)
    ]);

    return {
      topics: (topicsRes.data.data || []) as Topic[],
      assignment: (assignRes.data.data || {}) as Assignment,
      members: (membersRes.data.data || []) as ClassMember[]
    };
  },

  getTopicQuestions: async (topicId: string): Promise<Question[]> => {
    const res = await api.get(`/api/questions/topics/${topicId}`);
    return res.data.data.questions || [];
  },

  updateAssignment: async (assignmentId: string, payload: UpdateAssignmentPayload): Promise<void> => {
    await api.patch(`/api/assignments/${assignmentId}`, payload);
  }
};

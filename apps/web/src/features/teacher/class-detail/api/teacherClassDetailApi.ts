import api from '@/api/axios';

export const teacherClassDetailApi = {
  getClassDetails: async (id: string) => {
    const res = await api.get(`/api/classes/${id}`);
    return res.data.data;
  },
  
  getClassStats: async (id: string) => {
    const res = await api.get(`/api/analytics/class/${id}`);
    return res.data.data;
  },
  
  updateClass: async (id: string, payload: { name: string; subject?: string; description?: string }) => {
    const res = await api.patch(`/api/classes/${id}`, payload);
    return res.data.data;
  },

  deleteClass: async (id: string) => {
    await api.delete(`/api/classes/${id}`);
  },

  getClassAnalytics: async (id: string) => {
    const [topicsRes, studentsRes] = await Promise.all([
      api.get(`/api/analytics/class/${id}/topics`),
      api.get(`/api/analytics/class/${id}/students`),
    ]);
    return {
      topic_accuracy: topicsRes.data.data?.map((t: any) => ({
        topic_id: t.topic_id,
        topic: t.topic,
        accuracy: Number(t.accuracy_pct || 0),
      })) || [],
      leaderboard: studentsRes.data.data || [],
    };
  },
  
  getClassMembers: async (id: string) => {
    const res = await api.get(`/api/classes/${id}/members`);
    return res.data.data?.members || res.data.data || [];
  },
  
  getClassAssignments: async (id: string) => {
    const res = await api.get(`/api/assignments?class_id=${id}&limit=100`);
    return res.data.data || [];
  },

  getTopicStudents: async (classId: string, topicId: string) => {
    const res = await api.get(`/api/analytics/class/${classId}/topics/${topicId}/students`);
    return res.data.data || [];
  },

  removeStudent: async (classId: string, studentId: string) => {
    await api.delete(`/api/classes/${classId}/members/${studentId}`);
  },

  deleteAssignment: async (assignmentId: string) => {
    await api.delete(`/api/assignments/${assignmentId}`);
  },

  togglePublish: async (assignmentId: string, isPublished: boolean) => {
    if (isPublished) {
      await api.post(`/api/assignments/${assignmentId}/unpublish`);
    } else {
      await api.post(`/api/assignments/${assignmentId}/publish`);
    }
  }
};

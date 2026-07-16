import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';

export const useClassDetails = (id: string) => {
  return useQuery({
    queryKey: ['class', id],
    queryFn: async () => {
      const res = await api.get(`/api/classes/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useClassStats = (id: string) => {
  return useQuery({
    queryKey: ['classStats', id],
    queryFn: async () => {
      const res = await api.get(`/api/analytics/class/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useClassAnalytics = (id: string) => {
  return useQuery({
    queryKey: ['classAnalytics', id],
    queryFn: async () => {
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
    enabled: !!id,
  });
};

export const useClassMembers = (id: string) => {
  return useQuery({
    queryKey: ['classMembers', id],
    queryFn: async () => {
      const res = await api.get(`/api/classes/${id}/members`);
      return res.data.data || [];
    },
    enabled: !!id,
  });
};

export const useClassAssignments = (id: string) => {
  return useQuery({
    queryKey: ['classAssignments', id],
    queryFn: async () => {
      const res = await api.get(`/api/assignments?class_id=${id}`);
      return res.data.data || [];
    },
    enabled: !!id,
  });
};

export const useTopicStudents = (classId: string, topicId: string | null) => {
  return useQuery({
    queryKey: ['topicStudents', classId, topicId],
    queryFn: async () => {
      if (!topicId) return [];
      const res = await api.get(`/api/analytics/class/${classId}/topics/${topicId}/students`);
      return res.data.data || [];
    },
    enabled: !!classId && !!topicId,
  });
};

export const useClassMutations = (classId: string) => {
  const queryClient = useQueryClient();

  const removeStudent = useMutation({
    mutationFn: async (studentId: string) => {
      await api.delete(`/api/classes/${classId}/members/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classMembers', classId] });
      queryClient.invalidateQueries({ queryKey: ['classAnalytics', classId] });
      queryClient.invalidateQueries({ queryKey: ['classStats', classId] });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.delete(`/api/assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classAssignments', classId] });
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ assignmentId, isPublished }: { assignmentId: string; isPublished: boolean }) => {
      if (isPublished) {
        await api.post(`/api/assignments/${assignmentId}/unpublish`);
      } else {
        await api.post(`/api/assignments/${assignmentId}/publish`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classAssignments', classId] });
    },
  });

  return {
    removeStudent,
    deleteAssignment,
    togglePublish,
  };
};

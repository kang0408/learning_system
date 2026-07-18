import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherClassDetailApi } from '../api/teacherClassDetailApi';

// Combine all main queries into one SuspenseQuery to prevent waterfall
export const useClassDetailData = (id: string) => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'class-detail', id],
    queryFn: async () => {
      const [classDetails, classStats, analytics, members, assignments] = await Promise.all([
        teacherClassDetailApi.getClassDetails(id),
        teacherClassDetailApi.getClassStats(id),
        teacherClassDetailApi.getClassAnalytics(id),
        teacherClassDetailApi.getClassMembers(id),
        teacherClassDetailApi.getClassAssignments(id),
      ]);

      return {
        classDetails,
        classStats,
        analytics,
        members,
        assignments
      };
    }
  });
};

export const useTopicStudents = (classId: string, topicId: string | null) => {
  return useQuery({
    queryKey: ['teacher', 'topicStudents', classId, topicId],
    queryFn: () => teacherClassDetailApi.getTopicStudents(classId, topicId!),
    enabled: !!classId && !!topicId,
  });
};

export const useClassMutations = (classId: string) => {
  const queryClient = useQueryClient();

  const removeStudent = useMutation({
    mutationFn: (studentId: string) => teacherClassDetailApi.removeStudent(classId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'class-detail', classId] });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: (assignmentId: string) => teacherClassDetailApi.deleteAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'class-detail', classId] });
    },
  });

  const togglePublish = useMutation({
    mutationFn: ({ assignmentId, isPublished }: { assignmentId: string; isPublished: boolean }) => 
      teacherClassDetailApi.togglePublish(assignmentId, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'class-detail', classId] });
    },
  });

  const updateClass = useMutation({
    mutationFn: (payload: { name: string; subject?: string; description?: string }) => 
      teacherClassDetailApi.updateClass(classId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes'] });
    },
  });

  const deleteClass = useMutation({
    mutationFn: () => teacherClassDetailApi.deleteClass(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes'] });
    },
  });

  return {
    removeStudent,
    deleteAssignment,
    togglePublish,
    updateClass,
    deleteClass,
  };
};

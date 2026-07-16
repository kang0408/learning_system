import { useSuspenseQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teacherNewAssignmentApi } from '../api/teacherNewAssignmentApi';
import type { CreateAssignmentPayload } from '../types';

export const useNewAssignmentData = (classId: string) => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'new-assignment', classId],
    queryFn: () => teacherNewAssignmentApi.getInitialData(classId),
  });
};

export const useTopicQuestions = (topicId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['teacher', 'topic-questions', topicId],
    queryFn: () => teacherNewAssignmentApi.getTopicQuestions(topicId),
    enabled,
    staleTime: Infinity,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) => teacherNewAssignmentApi.createAssignment(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'class-detail', variables.class_id] });
    },
  });
};

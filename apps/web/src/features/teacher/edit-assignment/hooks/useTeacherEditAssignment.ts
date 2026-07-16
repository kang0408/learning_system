import { useSuspenseQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teacherEditAssignmentApi } from '../api/teacherEditAssignmentApi';
import type { UpdateAssignmentPayload } from '../types';

export const useEditAssignmentData = (classId: string, assignmentId: string) => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'edit-assignment', classId, assignmentId],
    queryFn: () => teacherEditAssignmentApi.getInitialData(classId, assignmentId),
  });
};

export const useTopicQuestions = (topicId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['teacher', 'topic-questions', topicId],
    queryFn: () => teacherEditAssignmentApi.getTopicQuestions(topicId),
    enabled,
    staleTime: Infinity, // Cache forever during this session
  });
};

export const useUpdateAssignment = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAssignmentPayload) => teacherEditAssignmentApi.updateAssignment(assignmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'class-detail'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'edit-assignment', assignmentId] });
    },
  });
};

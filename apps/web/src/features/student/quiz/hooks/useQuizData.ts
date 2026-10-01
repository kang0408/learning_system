import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentQuizApi } from '../api/studentQuizApi';
import type { AnswerPayload } from '../types';

export const useQuizSession = (assignmentId: string, mode?: string, topicId?: string) => {
  return useSuspenseQuery({
    queryKey: ['quizSession', assignmentId, mode, topicId],
    queryFn: () => studentQuizApi.initSession(assignmentId, mode, topicId),
    // Prevent refetching to avoid creating multiple sessions unintentionally
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false
  });
};

export const useSubmitAnswer = () => {
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: AnswerPayload }) =>
      studentQuizApi.submitAnswer(sessionId, payload),
  });
};

export const useFinishQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => studentQuizApi.finishSession(sessionId),
    onSuccess: () => {
      // Xoá cache session cũ để khi Retry ứng dụng sẽ xin session mới
      queryClient.invalidateQueries({ queryKey: ['quizSession'] });
      queryClient.invalidateQueries({ queryKey: ['studentDailySchedule'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['studentAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['studentWeakTopics'] });
      queryClient.invalidateQueries({ queryKey: ['studentAssignments'] });
    }
  });
};

export const useAbandonQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => studentQuizApi.abandonSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizSession'] });
    }
  });
};

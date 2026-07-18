import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentQuizApi } from '../api/studentQuizApi';
import type { AnswerPayload } from '../types';

export const useQuizSession = (assignmentId: string) => {
  return useSuspenseQuery({
    queryKey: ['quizSession', assignmentId],
    queryFn: () => studentQuizApi.initSession(assignmentId),
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
    }
  });
};

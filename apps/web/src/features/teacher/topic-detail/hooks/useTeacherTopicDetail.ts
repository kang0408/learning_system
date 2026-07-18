import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherTopicDetailApi } from '../api/teacherTopicDetailApi';
import type { GenerateAiQuestionsPayload, BulkSaveQuestionsPayload } from '../types';

export const useTopicDetail = (topicId: string) => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'topic', topicId],
    queryFn: () => teacherTopicDetailApi.getTopic(topicId),
  });
};

export const useTopicQuestions = (topicId: string, searchTerm: string) => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'topic-questions', topicId, searchTerm],
    queryFn: () => teacherTopicDetailApi.getQuestions(topicId, searchTerm),
  });
};

export const useAllTopics = () => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'all-topics'],
    queryFn: () => teacherTopicDetailApi.getAllTopics(),
  });
};

export const useUpdateTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, payload }: { topicId: string, payload: any }) => teacherTopicDetailApi.updateTopic(topicId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topic', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'all-topics'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topics'] });
    },
  });
};

export const useDeleteTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teacherTopicDetailApi.deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'all-topics'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topics'] });
    },
  });
};

export const useSaveQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId?: string, payload: any }) => {
      if (questionId) {
        return teacherTopicDetailApi.updateQuestion(questionId, payload);
      }
      return teacherTopicDetailApi.createQuestion(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topic-questions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topics'] });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teacherTopicDetailApi.deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topic-questions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topics'] });
    },
  });
};

export const useGenerateAiQuestions = () => {
  return useMutation({
    mutationFn: (payload: GenerateAiQuestionsPayload) => teacherTopicDetailApi.generateAiQuestions(payload),
  });
};

export const useBulkCreateQuestions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkSaveQuestionsPayload) => teacherTopicDetailApi.bulkCreateQuestions(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topic-questions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topics'] });
    },
  });
};

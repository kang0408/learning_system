import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherQuestionBankApi } from '../api/teacherQuestionBankApi';

export const useTopics = (searchTerm: string, classId?: string) => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'topics', searchTerm, classId || 'all'],
    queryFn: () => teacherQuestionBankApi.getTopics(searchTerm, classId),
  });
};

export const useTeacherClasses = () => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: () => teacherQuestionBankApi.getClasses(),
  });
};

export const useCreateTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teacherQuestionBankApi.createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topics'] });
    },
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teacherQuestionBankApi.createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topics'] });
    },
  });
};

export const useImportCsv = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teacherQuestionBankApi.importCsv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topics'] });
    },
  });
};

export const useDeleteTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teacherQuestionBankApi.deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topics'] });
    },
  });
};

export const useBatchDeleteTopics = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teacherQuestionBankApi.batchDeleteTopics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'topics'] });
    },
  });
};

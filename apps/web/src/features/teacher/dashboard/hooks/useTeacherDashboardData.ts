import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherDashboardApi } from '../api/teacherDashboardApi';
import type { CreateClassPayload } from '../types';

export const useTeacherDashboardData = () => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: teacherDashboardApi.getClasses,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateClassPayload) => teacherDashboardApi.createClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes'] });
    },
  });
};

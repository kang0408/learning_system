import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentClassesApi } from '../api/studentClassesApi';

export const useClassesData = () => {
  return useSuspenseQuery({
    queryKey: ['studentClasses', 'my'],
    queryFn: studentClassesApi.getMyClasses,
  });
};

export const useJoinClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentClassesApi.joinClass,
    onSuccess: () => {
      // Invalidate and refetch classes when joining a new one
      queryClient.invalidateQueries({ queryKey: ['studentClasses', 'my'] });
    },
  });
};

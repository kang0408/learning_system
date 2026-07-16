import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherClassMembersApi } from '../api/teacherClassMembersApi';

export const useClassMembersData = (classId: string, page: number) => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'class-members', classId, page],
    queryFn: () => teacherClassMembersApi.getMembers(classId, page),
  });
};

export const useRemoveMember = (classId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => teacherClassMembersApi.removeMember(classId, studentId),
    onSuccess: () => {
      // Invalidate all pages of this class members
      queryClient.invalidateQueries({ queryKey: ['teacher', 'class-members', classId] });
    },
  });
};

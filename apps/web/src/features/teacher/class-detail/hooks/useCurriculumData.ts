import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherCurriculumApi } from '../api/teacherCurriculumApi';
import type {
  ClassCurriculum,
  CreateCurriculumPayload,
  UpdateCurriculumPayload,
  ReorderCurriculumItem
} from '../types/curriculum.types';

export const useCurriculums = (classId: string) => {
  return useQuery({
    queryKey: ['teacher', 'class-curriculums', classId],
    queryFn: () => teacherCurriculumApi.getCurriculums(classId),
    enabled: !!classId,
    staleTime: 1000 * 60 * 2 // 2 minutes
  });
};

export const useCurriculumMutations = (classId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['teacher', 'class-curriculums', classId];

  const createCurriculum = useMutation({
    mutationFn: (payload: CreateCurriculumPayload) =>
      teacherCurriculumApi.createCurriculum(classId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const updateCurriculum = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCurriculumPayload }) =>
      teacherCurriculumApi.updateCurriculum(classId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteCurriculum = useMutation({
    mutationFn: (id: string) => teacherCurriculumApi.deleteCurriculum(classId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const reorderCurriculums = useMutation({
    mutationFn: (orders: ReorderCurriculumItem[]) =>
      teacherCurriculumApi.reorderCurriculums(classId, orders),
    onMutate: async (newOrders) => {
      await queryClient.cancelQueries({ queryKey });
      const previousCurriculums = queryClient.getQueryData<ClassCurriculum[]>(queryKey);

      if (previousCurriculums) {
        const orderMap = new Map(newOrders.map(o => [o.id, o.order_index]));
        const optimisticallyOrdered = [...previousCurriculums]
          .map(item => ({
            ...item,
            order_index: orderMap.has(item.id) ? orderMap.get(item.id)! : item.order_index
          }))
          .sort((a, b) => a.order_index - b.order_index);

        queryClient.setQueryData<ClassCurriculum[]>(queryKey, optimisticallyOrdered);
      }

      return { previousCurriculums };
    },
    onError: (_err, _newOrders, context) => {
      if (context?.previousCurriculums) {
        queryClient.setQueryData(queryKey, context.previousCurriculums);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    reorderCurriculums
  };
};

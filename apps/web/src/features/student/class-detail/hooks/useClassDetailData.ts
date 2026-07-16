import { useSuspenseQueries } from '@tanstack/react-query';
import { studentClassDetailApi } from '../api/studentClassDetailApi';

export const useClassDetailData = (id: string) => {
  const [
    { data: classData },
    { data: assignments }
  ] = useSuspenseQueries({
    queries: [
      {
        queryKey: ['studentClassDetail', id],
        queryFn: () => studentClassDetailApi.getClassDetail(id),
      },
      {
        queryKey: ['studentClassAssignments', id],
        queryFn: () => studentClassDetailApi.getClassAssignments(id),
      }
    ]
  });

  return {
    classData,
    assignments
  };
};

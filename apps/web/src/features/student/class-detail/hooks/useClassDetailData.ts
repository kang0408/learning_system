import { useSuspenseQueries } from '@tanstack/react-query';
import { studentClassDetailApi } from '../api/studentClassDetailApi';
import { studentCurriculumApi } from '../api/studentCurriculumApi';

export const useClassDetailData = (id: string) => {
  const [
    { data: classData },
    { data: assignments },
    { data: curriculums }
  ] = useSuspenseQueries({
    queries: [
      {
        queryKey: ['studentClassDetail', id],
        queryFn: () => studentClassDetailApi.getClassDetail(id),
      },
      {
        queryKey: ['studentClassAssignments', id],
        queryFn: () => studentClassDetailApi.getClassAssignments(id),
      },
      {
        queryKey: ['studentClassCurriculums', id],
        queryFn: () => studentCurriculumApi.getCurriculums(id),
      }
    ]
  });

  return {
    classData,
    assignments,
    curriculums
  };
};

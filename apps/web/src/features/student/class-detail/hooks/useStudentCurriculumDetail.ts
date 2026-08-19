import { useSuspenseQueries } from '@tanstack/react-query';
import { studentClassDetailApi } from '../api/studentClassDetailApi';
import { studentCurriculumApi } from '../api/studentCurriculumApi';

export const useStudentCurriculumDetail = (classId: string, curriculumId: string) => {
  const [
    { data: classData },
    { data: assignments = [] },
    { data: curriculums = [] },
    { data: curriculumDetail }
  ] = useSuspenseQueries({
    queries: [
      {
        queryKey: ['studentClassDetail', classId],
        queryFn: () => studentClassDetailApi.getClassDetail(classId),
      },
      {
        queryKey: ['studentClassAssignments', classId],
        queryFn: () => studentClassDetailApi.getClassAssignments(classId),
      },
      {
        queryKey: ['studentClassCurriculums', classId],
        queryFn: () => studentCurriculumApi.getCurriculums(classId),
      },
      {
        queryKey: ['studentCurriculumDetail', classId, curriculumId],
        queryFn: () => studentCurriculumApi.getCurriculumById(classId, curriculumId),
      }
    ]
  });

  const currentIndex = curriculums.findIndex(c => c.id === curriculumId);
  const prevCurriculum = currentIndex > 0 ? curriculums[currentIndex - 1] : null;
  const nextCurriculum =
    currentIndex >= 0 && currentIndex < curriculums.length - 1
      ? curriculums[currentIndex + 1]
      : null;

  return {
    classData,
    assignments,
    curriculums,
    curriculum: curriculumDetail || curriculums[currentIndex],
    currentIndex: currentIndex >= 0 ? currentIndex : 0,
    totalCount: curriculums.length,
    prevCurriculum,
    nextCurriculum
  };
};

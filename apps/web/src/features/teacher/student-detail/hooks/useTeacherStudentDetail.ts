import { useSuspenseQuery } from '@tanstack/react-query';
import { teacherStudentDetailApi } from '../api/teacherStudentDetailApi';

export const useTeacherStudentDetail = (classId: string, studentId: string) => {
  return useSuspenseQuery({
    queryKey: ['teacher', 'student-detail', classId, studentId],
    queryFn: () => teacherStudentDetailApi.getStudentDetail(classId, studentId),
  });
};

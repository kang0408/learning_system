import api from '@/api/axios';
import type { TeacherStudentDetailData, StudentStats, StudentAssignment } from '../types';

export const teacherStudentDetailApi = {
  getStudentDetail: async (classId: string, studentId: string): Promise<TeacherStudentDetailData> => {
    const [statsRes, assignRes, membersRes] = await Promise.all([
      api.get(`/api/analytics/student/${studentId}`),
      api.get(`/api/assignments?class_id=${classId}&student_id=${studentId}`),
      api.get(`/api/classes/${classId}/members?limit=1000`)
    ]);

    const members = membersRes.data.data || [];
    const currentStudent = members.find((m: any) => m.student_id === studentId);

    return {
      stats: statsRes.data.data as StudentStats,
      assignments: (assignRes.data.data || []) as StudentAssignment[],
      studentInfo: currentStudent ? currentStudent.student : null
    };
  }
};

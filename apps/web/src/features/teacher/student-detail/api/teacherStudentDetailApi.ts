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
  },

  downloadStudentReportPdf: async (classId: string, studentId: string, studentName: string): Promise<void> => {
    const response = await api.get(`/api/classes/${classId}/students/${studentId}/report/pdf`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const safeName = (studentName || 'Hoc_Sinh').replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Bao_Cao_Hoc_Sinh_${safeName}_${dateStr}.pdf`);

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getStudentReportData: async (classId: string, studentId: string): Promise<any> => {
    const response = await api.get(`/api/classes/${classId}/students/${studentId}/report/data`);
    return response.data?.data;
  }
};


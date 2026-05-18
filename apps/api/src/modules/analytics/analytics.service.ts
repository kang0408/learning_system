import { prisma } from '../../lib/prisma';

export class AnalyticsService {
  static async getStudentDashboard(studentId: string) {
    const totalSessions = await prisma.quizSession.count({
      where: { student_id: studentId, status: 'completed' }
    });

    const progress = await prisma.sm2Progress.aggregate({
      where: { student_id: studentId },
      _avg: { easiness_factor: true },
      _count: { _all: true }
    });

    // Mock streak for now
    const currentStreak = 5;

    return { totalSessions, itemsStudied: progress._count._all, averageEasiness: progress._avg.easiness_factor, currentStreak };
  }

  static async getTeacherClassStats(teacherId: string, classId: string) {
    // Verify teacher owns class
    const classData = await prisma.class.findFirst({
      where: { id: classId, teacher_id: teacherId }
    });
    if (!classData) throw { status: 403, message: 'Forbidden' };

    const studentsCount = await prisma.classMember.count({ where: { class_id: classId } });
    const assignmentsCount = await prisma.assignment.count({ where: { class_id: classId } });
    
    // Average score of assignments in this class
    const avgScoreResult = await prisma.quizSession.aggregate({
      where: { assignment: { class_id: classId }, status: 'completed' },
      _avg: { score: true }
    });

    return { studentsCount, assignmentsCount, averageScore: avgScoreResult._avg.score };
  }
}

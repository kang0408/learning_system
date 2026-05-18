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
}

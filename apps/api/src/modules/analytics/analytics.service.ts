import { prisma } from '../../lib/prisma';
import { AnalyticsRepository } from './analytics.repository';

export class AnalyticsService {
  // --- STUDENT DASHBOARD ---
  static async getStudentDashboard(studentId: string) {
    const totalSessions = await prisma.quizSession.count({ where: { student_id: studentId, status: 'completed' } });
    const totalAnswers = await prisma.sessionAnswer.count({ where: { session: { student_id: studentId, status: 'completed' } } });

    const correctAnswers = await prisma.sessionAnswer.count({ where: { session: { student_id: studentId, status: 'completed' }, is_correct: true } });
    const overallAccuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    const activeDates = await AnalyticsRepository.getActiveDates(studentId);

    let currentStreakDays = 0;
    let longestStreakDays = 0;

    if (activeDates.length > 0) {
      const dates = activeDates.map(d => new Date(d.date));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate longest streak
      let currentLen = 1;
      longestStreakDays = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const diff = Math.floor((dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 3600 * 24));
        if (diff === 1) {
          currentLen++;
          if (currentLen > longestStreakDays) longestStreakDays = currentLen;
        } else {
          currentLen = 1;
        }
      }

      // Calculate current streak
      const diffFirst = Math.floor((today.getTime() - dates[0].getTime()) / (1000 * 3600 * 24));
      if (diffFirst <= 1) {
        currentStreakDays = 1;
        for (let i = 0; i < dates.length - 1; i++) {
          const diff = Math.floor((dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 3600 * 24));
          if (diff === 1) {
            currentStreakDays++;
          } else {
            break;
          }
        }
      }
    }

    const sm2SummaryData = await AnalyticsRepository.getSM2Summary(studentId);
    const totalQ = sm2SummaryData?.total_questions || 0;
    const sm2_summary = {
      total_questions: totalQ,
      new: {
        count: sm2SummaryData?.new_count || 0,
        pct: totalQ > 0 ? ((sm2SummaryData?.new_count || 0) / totalQ) * 100 : 0
      },
      learning: {
        count: sm2SummaryData?.learning_count || 0,
        pct: totalQ > 0 ? ((sm2SummaryData?.learning_count || 0) / totalQ) * 100 : 0,
        at_risk: sm2SummaryData?.learning_at_risk || 0,
        in_progress: sm2SummaryData?.learning_in_progress || 0
      },
      mastered: {
        count: sm2SummaryData?.mastered_count || 0,
        pct: totalQ > 0 ? ((sm2SummaryData?.mastered_count || 0) / totalQ) * 100 : 0
      },
      due_today: sm2SummaryData?.due_today || 0
    };

    const weeklyActivity = await AnalyticsRepository.getWeeklyActivity(studentId);

    return {
      total_sessions: totalSessions,
      total_questions_answered: totalAnswers,
      overall_accuracy: overallAccuracy,
      current_streak_days: currentStreakDays,
      longest_streak_days: longestStreakDays,
      sm2_summary,
      weekly_activity: weeklyActivity
    };
  }

  static async getStudentCalendar(studentId: string) {
    const calendar = await AnalyticsRepository.getStudentCalendar(studentId);
    return { calendar };
  }

  static async getStudentWeakTopics(studentId: string) {
    const weakTopics = await AnalyticsRepository.getWeakTopicsBySM2(studentId);
    const recentAcc = await AnalyticsRepository.getRecentTopicAccuracy(studentId, 30);
    
    const recentAccMap = new Map(recentAcc.map(r => [r.topic, r.recent_accuracy_pct]));

    const merged = weakTopics.map(wt => {
      const recent_accuracy_pct = Math.round((recentAccMap.get(wt.topic) || 0) * 10) / 10;
      let trend = 'stable';
      
      if (recent_accuracy_pct > wt.accuracy_pct + 5) {
        trend = 'improving';
      } else if (recent_accuracy_pct < wt.accuracy_pct - 5) {
        trend = 'declining';
      }

      return {
        ...wt,
        recent_accuracy_pct,
        trend
      };
    });

    return { weak_topics: merged };
  }

  // --- TEACHER DASHBOARD ---
  static async getTeacherClassStats(teacherId: string, classId: string) {
    const classData = await prisma.class.findFirst({ where: { id: classId, teacher_id: teacherId } });
    if (!classData) throw { status: 403, message: 'Forbidden' };

    const totalStudents = await prisma.classMember.count({ where: { class_id: classId, is_active: true } });

    // Current week active
    const activeStudentsResult = await AnalyticsRepository.getTeacherClassActiveStudents(classId, 7);
    const currentActive = activeStudentsResult[0]?.active_count || 0;

    // Previous week active
    const prevActiveStudentsResult = await AnalyticsRepository.getTeacherClassActiveStudents(classId, 14, 7);
    const prevActive = prevActiveStudentsResult[0]?.active_count || 0;

    // Averages (current and previous)
    const currentAvg = await AnalyticsRepository.getTeacherClassAverageScore(classId, 7);
    const prevAvg = await AnalyticsRepository.getTeacherClassAverageScore(classId, 14, 7);

    // Completion Rate (assignments with at least one completed session)
    const totalAssignments = await prisma.assignment.count({ where: { class_id: classId, deleted_at: null } });
    const completionRate = totalStudents > 0 ? Math.round((currentActive / totalStudents) * 100) : 0;
    const prevCompletionRate = totalStudents > 0 ? Math.round((prevActive / totalStudents) * 100) : 0;

    const sm2SummaryData = await AnalyticsRepository.getTeacherClassSM2Summary(classId);
    const totalQ = sm2SummaryData?.total_questions || 0;
    const sm2_summary = {
      total_questions: totalQ,
      new: {
        count: sm2SummaryData?.new_count || 0,
        pct: totalQ > 0 ? ((sm2SummaryData?.new_count || 0) / totalQ) * 100 : 0
      },
      learning: {
        count: sm2SummaryData?.learning_count || 0,
        pct: totalQ > 0 ? ((sm2SummaryData?.learning_count || 0) / totalQ) * 100 : 0,
        at_risk: sm2SummaryData?.learning_at_risk || 0,
        in_progress: sm2SummaryData?.learning_in_progress || 0
      },
      mastered: {
        count: sm2SummaryData?.mastered_count || 0,
        pct: totalQ > 0 ? ((sm2SummaryData?.mastered_count || 0) / totalQ) * 100 : 0
      },
      due_today: sm2SummaryData?.due_today || 0
    };

    return {
      class_name: classData.name,
      total_students: totalStudents,
      active_students: {
        current: currentActive,
        trend: currentActive >= prevActive ? 'up' : 'down'
      },
      completion_rate: {
        current: isNaN(completionRate) ? 0 : completionRate,
        trend: completionRate >= prevCompletionRate ? 'up' : 'down'
      },
      average_score: {
        current: Math.round(currentAvg[0]?.avg_score || 0),
        trend: (currentAvg[0]?.avg_score || 0) >= (prevAvg[0]?.avg_score || 0) ? 'up' : 'down'
      },
      sm2_summary
    };
  }

  static async getTeacherClassTopics(teacherId: string, classId: string) {
    const topics = await AnalyticsRepository.getTeacherClassTopics(classId);
    return topics;
  }

  static async getTeacherClassStudents(teacherId: string, classId: string) {
    const students = await AnalyticsRepository.getTeacherClassStudents(classId);
    return students;
  }

  static async getTeacherClassTopicStudents(teacherId: string, classId: string, topicId: string) {
    const isGeneral = topicId.toLowerCase() === 'general' || topicId.toLowerCase() === 'null';
    const students = await AnalyticsRepository.getTeacherClassTopicStudents(classId, topicId, isGeneral);
    return students;
  }

  static async getTeacherStudentStats(teacherId: string, studentId: string) {
    // Verify student is in at least one of the teacher's classes
    const membership = await prisma.classMember.findFirst({
      where: {
        student_id: studentId,
        is_active: true,
        class: { teacher_id: teacherId, deleted_at: null }
      }
    });

    if (!membership) {
      throw { status: 403, message: 'Học sinh này không thuộc bất kỳ lớp nào của bạn.' };
    }

    // Combine dashboard, calendar, and weak topics
    const dashboard = await this.getStudentDashboard(studentId);
    const calendar = await this.getStudentCalendar(studentId);
    const weakTopics = await this.getStudentWeakTopics(studentId);

    return {
      ...dashboard,
      ...calendar,
      ...weakTopics
    };
  }

  // --- PARENT DASHBOARD ---
  static async getParentChildren(parentId: string) {
    const children = await AnalyticsRepository.getParentChildrenStats(parentId);
    return children;
  }

  static async getParentChildWeekly(parentId: string, studentId: string) {
    throw { status: 501, message: 'Chưa implement' };
  }
}

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
      today.setHours(0,0,0,0);

      // Calculate longest streak
      let currentLen = 1;
      longestStreakDays = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const diff = Math.floor((dates[i].getTime() - dates[i+1].getTime()) / (1000 * 3600 * 24));
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
          const diff = Math.floor((dates[i].getTime() - dates[i+1].getTime()) / (1000 * 3600 * 24));
          if (diff === 1) {
            currentStreakDays++;
          } else {
            break;
          }
        }
      }
    }

    const sm2Progress = await prisma.sm2Progress.findMany({ where: { student_id: studentId } });
    const today = new Date();
    today.setHours(0,0,0,0);
    const questionsDueToday = sm2Progress.filter(p => p.next_review_date <= today).length;
    const masteredQuestions = sm2Progress.filter(p => Number(p.easiness_factor) >= 3.0 && p.repetition_count > 3).length;
    const newQuestions = sm2Progress.filter(p => p.repetition_count === 0).length;
    const learningQuestions = sm2Progress.length - masteredQuestions - newQuestions;

    const weeklyActivity = await AnalyticsRepository.getWeeklyActivity(studentId);

    return {
      total_sessions: totalSessions,
      total_questions_answered: totalAnswers,
      overall_accuracy: overallAccuracy,
      current_streak_days: currentStreakDays,
      longest_streak_days: longestStreakDays,
      questions_due_today: questionsDueToday,
      mastered_questions: masteredQuestions,
      learning_questions: learningQuestions,
      new_questions: newQuestions,
      weekly_activity: weeklyActivity
    };
  }

  static async getStudentCalendar(studentId: string) {
    const calendar = await AnalyticsRepository.getStudentCalendar(studentId);
    return { calendar };
  }

  static async getStudentWeakTopics(studentId: string) {
    const weakTopics = await AnalyticsRepository.getStudentWeakTopics(studentId);
    return { weak_topics: weakTopics };
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
      }
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
    return { weekly_report: "Report data" };
  }
}

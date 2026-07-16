import { ApiError } from '../../lib/ApiError';
import { AnalyticsRepository } from './analytics.repository';

export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}
  // --- STUDENT DASHBOARD ---
  async getStudentDashboard(studentId: string) {
    const totalSessions = await this.analyticsRepository.countCompletedSessions(studentId);
    const totalAnswers = await this.analyticsRepository.countTotalAnswers(studentId);

    const correctAnswers = await this.analyticsRepository.countCorrectAnswers(studentId);
    const overallAccuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    const activeDates = await this.analyticsRepository.getActiveDates(studentId);

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

    const sm2SummaryData = await this.analyticsRepository.getSM2Summary(studentId);
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

    const weeklyActivity = await this.analyticsRepository.getWeeklyActivity(studentId);

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

  async getStudentCalendar(studentId: string) {
    const calendar = await this.analyticsRepository.getStudentCalendar(studentId);
    return { calendar };
  }

  async getStudentWeakTopics(studentId: string) {
    const weakTopics = await this.analyticsRepository.getWeakTopicsBySM2(studentId);
    const recentAcc = await this.analyticsRepository.getRecentTopicAccuracy(studentId, 30);
    
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
  async getTeacherClassStats(teacherId: string, classId: string) {
    const classData = await this.analyticsRepository.findTeacherClass(teacherId, classId);
    if (!classData) throw new ApiError(403, 'Forbidden');

    const totalStudents = await this.analyticsRepository.countActiveClassMembers(classId);

    // Current week active
    const activeStudentsResult = await this.analyticsRepository.getTeacherClassActiveStudents(classId, 7);
    const currentActive = activeStudentsResult[0]?.active_count || 0;

    // Previous week active
    const prevActiveStudentsResult = await this.analyticsRepository.getTeacherClassActiveStudents(classId, 14, 7);
    const prevActive = prevActiveStudentsResult[0]?.active_count || 0;

    // Averages (current and previous)
    const currentAvg = await this.analyticsRepository.getTeacherClassAverageScore(classId, 7);
    const prevAvg = await this.analyticsRepository.getTeacherClassAverageScore(classId, 14, 7);

    // Completion Rate (assignments with at least one completed session)
    const totalAssignments = await this.analyticsRepository.countClassAssignments(classId);
    const completionRate = totalStudents > 0 ? Math.round((currentActive / totalStudents) * 100) : 0;
    const prevCompletionRate = totalStudents > 0 ? Math.round((prevActive / totalStudents) * 100) : 0;

    const sm2SummaryData = await this.analyticsRepository.getTeacherClassSM2Summary(classId);
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

  async getTeacherClassTopics(teacherId: string, classId: string) {
    const topics = await this.analyticsRepository.getTeacherClassTopics(classId);
    return topics;
  }

  async getTeacherClassStudents(teacherId: string, classId: string) {
    const students = await this.analyticsRepository.getTeacherClassStudents(classId);
    return students;
  }

  async getTeacherClassTopicStudents(teacherId: string, classId: string, topicId: string) {
    const isGeneral = topicId.toLowerCase() === 'general' || topicId.toLowerCase() === 'null';
    const students = await this.analyticsRepository.getTeacherClassTopicStudents(classId, topicId, isGeneral);
    return students;
  }

  async getTeacherStudentStats(teacherId: string, studentId: string) {
    // Verify student is in at least one of the teacher's classes
    const membership = await this.analyticsRepository.findStudentInTeacherClasses(teacherId, studentId);

    if (!membership) {
      throw new ApiError(403, 'Học sinh này không thuộc bất kỳ lớp nào của bạn.');
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
  async getParentChildren(parentId: string) {
    const children = await this.analyticsRepository.getParentChildrenStats(parentId);
    return children;
  }

  async getParentChildWeekly(parentId: string, studentId: string) {
    throw new ApiError(501, 'Chưa implement');
  }
}

import { PrismaClient } from '@prisma/client';
import { AnalyticsRepository } from '../analytics/analytics.repository';
import { AiService } from '../ai/ai.service';

export interface CompleteStudentReportData {
  student_info: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  class_info: {
    id: string;
    name: string;
    subject: string;
    teacher_name: string;
    teacher_email: string;
  };
  generated_at: Date;
  summary: {
    cumulative_score: number;
    accuracy_pct: number;
    completed_assignments_count: number;
    total_assignments_count: number;
    sessions_count: number;
    streak_days: number;
    last_active_at: Date | null;
    // Benchmark vs Class
    class_average_score: number;
    class_average_accuracy_pct: number;
  };
  sm2_summary: {
    total_questions: number;
    mastered_count: number;
    learning_in_progress: number;
    learning_at_risk: number;
    new_count: number;
    due_today: number;
  };
  topic_performance: Array<{
    topic: string;
    accuracy_pct: number;
    total_answers: number;
    correct_answers: number;
  }>;
  weak_topics: Array<{
    topic: string;
    accuracy_pct: number;
    total_answers: number;
    error_count: number;
  }>;
  assignments: Array<{
    assignment_id: string;
    title: string;
    score: number;
    accuracy_pct: number;
    attempts_count: number;
    status: string;
    completed_at: Date | null;
  }>;
  ai_insights: {
    executive_summary: string;
    strengths_and_weaknesses: string;
    sm2_learning_analysis: string;
  };
}

export class StudentReportService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly analyticsRepo: AnalyticsRepository,
    private readonly aiService: AiService
  ) {}

  /**
   * Aggregates all personalized student performance metrics, SM2 Spaced Repetition status,
   * topic mastery radar, weak topics, assignment logs, and triggers Gemini AI diagnostic analysis.
   */
  async getStudentReportData(classId: string, studentId: string, teacherId: string): Promise<CompleteStudentReportData | null> {
    // 1. Verify class ownership and student membership
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            full_name: true,
            email: true,
          }
        },
        members: {
          where: { student_id: studentId },
          include: {
            student: {
              select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
              }
            }
          }
        }
      }
    });

    if (!classData || classData.teacher_id !== teacherId) {
      return null;
    }

    const membership = classData.members[0];
    if (!membership || !membership.student) {
      return null;
    }

    const student = membership.student;

    // 2. Query student stats, SM2, topics and class benchmark in parallel
    const [
      sm2Raw,
      topicPerfRaw,
      classStudentsRaw,
      assignmentsRaw,
      sessionsRaw
    ] = await Promise.all([
      this.analyticsRepo.getSM2Summary(studentId),
      this.analyticsRepo.getTopicPerformance(studentId),
      this.analyticsRepo.getTeacherClassStudents(classId),
      this.prisma.assignment.findMany({
        where: { class_id: classId, deleted_at: null },
        include: {
          quiz_sessions: {
            where: { student_id: studentId, status: 'completed' },
            orderBy: { score: 'desc' }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      this.prisma.quizSession.findMany({
        where: { student_id: studentId, status: 'completed' },
        orderBy: { finished_at: 'desc' },
        select: {
          score: true,
          total_q: true,
          correct_q: true,
          finished_at: true,
        }
      })
    ]);

    // 3. Compute student cumulative stats
    let totalAnswers = 0;
    let totalCorrect = 0;
    let totalScore = 0;
    let lastActiveAt: Date | null = null;

    if (sessionsRaw.length > 0) {
      lastActiveAt = sessionsRaw[0].finished_at;
      sessionsRaw.forEach(s => {
        const numScore = s.score ? Number(s.score) : 0;
        totalScore += numScore;
        totalAnswers += s.total_q || 0;
        totalCorrect += s.correct_q || 0;
      });
    }

    const accuracyPct = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 1000) / 10 : 0;

    // 4. Compute Class Benchmark (Average Score & Average Accuracy)
    let classTotalScore = 0;
    let classTotalAccuracy = 0;
    let classStudentsCount = classStudentsRaw.length;

    if (classStudentsCount > 0) {
      classStudentsRaw.forEach(cs => {
        classTotalScore += cs.score || 0;
        classTotalAccuracy += cs.accuracy || 0;
      });
    }

    const classAverageScore = classStudentsCount > 0 ? Math.round((classTotalScore / classStudentsCount) * 10) / 10 : 0;
    const classAverageAccuracy = classStudentsCount > 0 ? Math.round((classTotalAccuracy / classStudentsCount) * 10) / 10 : 0;

    // 5. Process SM2 Memory Breakdown
    const totalQ = sm2Raw?.total_questions || 0;
    const sm2Summary = {
      total_questions: totalQ,
      mastered_count: sm2Raw?.mastered_count || 0,
      learning_in_progress: sm2Raw?.learning_in_progress || 0,
      learning_at_risk: sm2Raw?.learning_at_risk || 0,
      new_count: sm2Raw?.new_count || 0,
      due_today: sm2Raw?.due_today || 0
    };

    // 6. Process Topic Performance & Weak Topics (< 60% accuracy)
    const topicPerformance = topicPerfRaw.map(tp => ({
      topic: tp.topic || 'Chung',
      accuracy_pct: Math.round((tp.accuracy_pct || 0) * 10) / 10,
      total_answers: tp.total_answers || 0,
      correct_answers: tp.correct_answers || 0
    }));

    const weakTopics = topicPerformance
      .filter(tp => tp.accuracy_pct < 60 && tp.total_answers >= 2)
      .map(tp => ({
        topic: tp.topic,
        accuracy_pct: tp.accuracy_pct,
        total_answers: tp.total_answers,
        error_count: tp.total_answers - tp.correct_answers
      }))
      .slice(0, 5);

    // 7. Process Assignment History
    let completedAssignmentsCount = 0;
    const assignments = assignmentsRaw.map(a => {
      const bestSession = a.quiz_sessions[0];
      const isCompleted = !!bestSession;
      if (isCompleted) completedAssignmentsCount++;

      const aAccuracy = bestSession && bestSession.total_q > 0 
        ? Math.round((bestSession.correct_q / bestSession.total_q) * 1000) / 10 
        : 0;

      return {
        assignment_id: a.id,
        title: a.title,
        score: bestSession && bestSession.score ? Number(bestSession.score) : 0,
        accuracy_pct: aAccuracy,
        attempts_count: a.quiz_sessions.length,
        status: isCompleted ? 'Hoàn thành' : 'Chưa làm',
        completed_at: bestSession ? bestSession.finished_at : null
      };
    });

    // 8. Prepare Stats Payload for AI Diagnostic
    const studentStatsPayload = {
      student_name: student.full_name,
      class_name: classData.name,
      subject: classData.subject,
      cumulative_score: totalScore,
      accuracy_pct: accuracyPct,
      sessions_count: sessionsRaw.length,
      class_benchmark: {
        average_score: classAverageScore,
        average_accuracy_pct: classAverageAccuracy
      },
      sm2_summary: sm2Summary,
      weak_topics: weakTopics.map(w => `${w.topic} (${w.accuracy_pct}% chính xác, sai ${w.error_count}/${w.total_answers} câu)`),
      topic_performance: topicPerformance.map(t => `${t.topic}: ${t.accuracy_pct}%`)
    };

    // 9. Generate AI Diagnostic Assessment
    const aiInsights = await this.aiService.generatePersonalizedStudentReport(
      classId,
      studentId,
      studentStatsPayload
    );

    return {
      student_info: {
        id: student.id,
        name: student.full_name,
        email: student.email,
        avatar_url: student.avatar_url,
      },
      class_info: {
        id: classData.id,
        name: classData.name,
        subject: classData.subject,
        teacher_name: classData.teacher?.full_name || 'Giáo viên bộ môn',
        teacher_email: classData.teacher?.email || '',
      },
      generated_at: new Date(),
      summary: {
        cumulative_score: totalScore,
        accuracy_pct: accuracyPct,
        completed_assignments_count: completedAssignmentsCount,
        total_assignments_count: assignmentsRaw.length,
        sessions_count: sessionsRaw.length,
        streak_days: 0,
        last_active_at: lastActiveAt,
        class_average_score: classAverageScore,
        class_average_accuracy_pct: classAverageAccuracy
      },
      sm2_summary: sm2Summary,
      topic_performance: topicPerformance,
      weak_topics: weakTopics,
      assignments,
      ai_insights: aiInsights || {
        executive_summary: 'Học sinh đang duy trì tiến độ học tập và hoàn thành các bài tập theo phân phối chương trình của lớp.',
        strengths_and_weaknesses: 'Học sinh nắm vững các kỹ năng cơ bản, cần tăng cường thêm thời lượng luyện tập các dạng bài nâng cao.',
        sm2_learning_analysis: 'Đa số kiến thức đang trong chu kỳ lặp lại ngắt quãng SM2 và duy trì mức độ ghi nhớ tích cực.'
      }
    };
  }
}

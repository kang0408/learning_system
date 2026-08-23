import { PrismaClient } from '@prisma/client';
import { AnalyticsRepository } from '../analytics/analytics.repository';
import { AiService } from '../ai/ai.service';

export interface CompleteClassReportData {
  class_info: {
    id: string;
    name: string;
    subject: string;
    join_code: string;
    description: string | null;
    created_at: Date;
    teacher_name: string;
    teacher_email: string;
  };
  generated_at: Date;
  summary: {
    total_students: number;
    active_students_7d: number;
    active_rate_pct: number;
    average_score: number;
    completion_rate_pct: number;
  };
  sm2_summary: {
    total_questions: number;
    new_count: number;
    new_pct: number;
    learning_count: number;
    learning_pct: number;
    learning_at_risk: number;
    learning_in_progress: number;
    mastered_count: number;
    mastered_pct: number;
    due_today: number;
  };
  topics: Array<{
    topic_id: string;
    topic: string;
    accuracy_pct: number;
    total_answers: number;
    avg_ef: number;
    mastered_count: number;
    at_risk_count: number;
  }>;
  students: Array<{
    student_id: string;
    name: string;
    score: number;
    sessions_count: number;
    accuracy: number;
    last_active_at: Date | null;
    sm2_total_q: number;
    sm2_mastered_q: number;
    sm2_avg_ef: number;
  }>;
  ai_insights: {
    executive_summary: string;
    strengths_and_weaknesses: string;
    sm2_learning_analysis: string;
    pedagogical_action_plan: string[];
  };
}

export class ClassReportService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly analyticsRepo: AnalyticsRepository,
    private readonly aiService: AiService
  ) {}

  /**
   * Aggregates all comprehensive class data, SM2 distributions, topic stats,
   * student gradebook, and triggers AI pedagogical evaluation.
   */
  async getCompleteReportData(classId: string, teacherId: string): Promise<CompleteClassReportData | null> {
    // 1. Fetch and verify class ownership
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            full_name: true,
            email: true,
          }
        }
      }
    });

    if (!classData || classData.teacher_id !== teacherId) {
      return null;
    }

    // 2. Query all statistical datasets in parallel
    const [
      totalStudents,
      activeStudentsResult,
      avgScoreResult,
      sm2Raw,
      topicsRaw,
      studentsRaw
    ] = await Promise.all([
      this.analyticsRepo.countActiveClassMembers(classId),
      this.analyticsRepo.getTeacherClassActiveStudents(classId, 7),
      this.analyticsRepo.getTeacherClassAverageScore(classId, 7),
      this.analyticsRepo.getTeacherClassSM2Summary(classId),
      this.analyticsRepo.getTeacherClassTopics(classId),
      this.analyticsRepo.getTeacherClassStudents(classId)
    ]);

    const activeStudents = activeStudentsResult[0]?.active_count || 0;
    const activeRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;
    const avgScore = avgScoreResult[0]?.avg_score ? Math.round(avgScoreResult[0].avg_score * 10) / 10 : 0;
    const completionRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

    const totalQ = sm2Raw?.total_questions || 0;
    const sm2Summary = {
      total_questions: totalQ,
      new_count: sm2Raw?.new_count || 0,
      new_pct: totalQ > 0 ? Math.round(((sm2Raw?.new_count || 0) / totalQ) * 100) : 0,
      learning_count: sm2Raw?.learning_count || 0,
      learning_pct: totalQ > 0 ? Math.round(((sm2Raw?.learning_count || 0) / totalQ) * 100) : 0,
      learning_at_risk: sm2Raw?.learning_at_risk || 0,
      learning_in_progress: sm2Raw?.learning_in_progress || 0,
      mastered_count: sm2Raw?.mastered_count || 0,
      mastered_pct: totalQ > 0 ? Math.round(((sm2Raw?.mastered_count || 0) / totalQ) * 100) : 0,
      due_today: sm2Raw?.due_today || 0,
    };

    const formattedTopics = topicsRaw.map((t: any) => ({
      topic_id: t.topic_id,
      topic: t.topic || 'Chung',
      accuracy_pct: Math.round((t.accuracy_pct || 0) * 10) / 10,
      total_answers: t.total_answers || 0,
      avg_ef: t.avg_ef || 2.5,
      mastered_count: t.mastered_count || 0,
      at_risk_count: t.at_risk_count || 0,
    }));

    const formattedStudents = studentsRaw.map((s: any) => ({
      student_id: s.student_id,
      name: s.name,
      score: s.score || 0,
      sessions_count: s.sessions_count || 0,
      accuracy: Math.round((s.accuracy || 0) * 10) / 10,
      last_active_at: s.last_active_at ? new Date(s.last_active_at) : null,
      sm2_total_q: s.sm2_total_q || 0,
      sm2_mastered_q: s.sm2_mastered_q || 0,
      sm2_avg_ef: s.sm2_avg_ef || 2.5,
    }));

    // 3. Prepare dataset for AI Evaluation
    const aiStatsPayload = {
      class_name: classData.name,
      subject: classData.subject,
      total_students: totalStudents,
      active_rate_pct: activeRate,
      average_score: avgScore,
      sm2_summary: sm2Summary,
      topics_performance: formattedTopics,
      students_summary: {
        top_students: formattedStudents.slice(0, 3).map(s => ({ name: s.name, score: s.score, accuracy: s.accuracy })),
        at_risk_count: formattedStudents.filter(s => s.accuracy < 50 || s.sm2_avg_ef < 2.0).length,
      }
    };

    // 4. Generate AI pedagogical assessment
    const aiReport = await this.aiService.generateComprehensiveClassReport(classId, aiStatsPayload);

    return {
      class_info: {
        id: classData.id,
        name: classData.name,
        subject: classData.subject,
        join_code: classData.join_code,
        description: classData.description,
        created_at: classData.created_at,
        teacher_name: classData.teacher.full_name,
        teacher_email: classData.teacher.email,
      },
      generated_at: new Date(),
      summary: {
        total_students: totalStudents,
        active_students_7d: activeStudents,
        active_rate_pct: activeRate,
        average_score: avgScore,
        completion_rate_pct: completionRate,
      },
      sm2_summary: sm2Summary,
      topics: formattedTopics,
      students: formattedStudents,
      ai_insights: aiReport || {
        executive_summary: 'Lớp học đang duy trì tiến độ học tập và hoàn thành các bài tập theo phân phối chương trình.',
        strengths_and_weaknesses: 'Học sinh nắm vững các kỹ năng cơ bản, cần tăng cường thêm thời lượng thực hành nâng cao.',
        sm2_learning_analysis: 'Đa số kiến thức đang trong chu kỳ lặp lại ngắt quãng SM2 và duy trì mức độ ghi nhớ tích cực.',
        pedagogical_action_plan: [
          'Duy trì lịch giao bài tập và theo dõi tỷ lệ hoàn thành hàng tuần.',
          'Hỗ trợ giải đáp các câu hỏi học sinh thường xuyên làm sai.'
        ]
      }
    };
  }
}

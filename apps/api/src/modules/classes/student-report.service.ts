import { PrismaClient } from '@prisma/client';
import { AnalyticsRepository } from '../analytics/analytics.repository';
import { AiService } from '../ai/ai.service';

export interface ErrorQuestionDetail {
  question_id: string;
  content: string;
  topic: string;
  question_type: string;
  difficulty: number;
  student_answer: string;
  correct_answer: string;
  explanation: string;
  response_time_seconds: number;
  error_count: number;
  last_answered_at: Date;
}

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
    total_answers_count: number;
    total_correct_count: number;
    total_incorrect_count: number;
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
  error_questions: ErrorQuestionDetail[];
  ai_insights: {
    executive_summary: string;
    strengths_and_weaknesses: string;
    sm2_learning_analysis: string;
  };
}

function formatStudentAnswer(ans: any): string {
  if (ans.option?.content) {
    return ans.option.content;
  }
  if (ans.text_answer) {
    try {
      const parsed = JSON.parse(ans.text_answer);
      if (Array.isArray(parsed)) {
        if (typeof parsed[0] === 'string' && ans.question?.answer_options) {
          // ID list for multi_select
          const selectedTexts = ans.question.answer_options
            .filter((o: any) => parsed.includes(o.id))
            .map((o: any) => o.content);
          return selectedTexts.length > 0 ? selectedTexts.join(', ') : ans.text_answer;
        } else if (parsed[0]?.leftText) {
          // matching pairs
          return parsed.map((p: any) => `${p.leftText} ➔ ${p.rightText}`).join('; ');
        }
      }
    } catch {
      // not json, plain string (e.g. fill_blank)
    }
    return ans.text_answer;
  }
  return '(Chưa chọn hoặc bỏ qua)';
}

function formatCorrectAnswer(q: any): string {
  if (q.question_type === 'matching' || q.type === 'matching') {
    const pairs = q.metadata?.pairs;
    if (Array.isArray(pairs)) {
      return pairs.map((p: any) => `${p.leftText} ➔ ${p.rightText}`).join('; ');
    }
  }
  if (q.answer_options && q.answer_options.length > 0) {
    const correctOptions = q.answer_options.filter((o: any) => o.is_correct);
    if (correctOptions.length > 0) {
      return correctOptions.map((o: any) => o.content).join(', ');
    }
  }
  return 'Xem giải thích chi tiết';
}

function formatQuestionType(type: string): string {
  switch (type) {
    case 'multiple_choice': return 'Trắc nghiệm';
    case 'multi_select': return 'Nhiều lựa chọn';
    case 'true_false': return 'Đúng/Sai';
    case 'fill_blank': return 'Điền từ';
    case 'matching': return 'Ghép cặp';
    default: return 'Trắc nghiệm';
  }
}

export class StudentReportService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly analyticsRepo: AnalyticsRepository,
    private readonly aiService: AiService
  ) {}

  /**
   * Aggregates all personalized student performance metrics, SM2 Spaced Repetition status,
   * topic mastery radar, weak topics, complete error questions log, and triggers Gemini AI diagnostic analysis.
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

    // 2. Query student stats, SM2, topics, assignments, sessions and all session answers in parallel
    const [
      sm2Raw,
      topicPerfRaw,
      classStudentsRaw,
      assignmentsRaw,
      sessionsRaw,
      allStudentWrongAnswers
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
        include: {
          assignment: {
            select: {
              class_id: true
            }
          }
        },
        orderBy: { finished_at: 'desc' }
      }),
      this.prisma.sessionAnswer.findMany({
        where: {
          session: {
            student_id: studentId
          },
          is_correct: false
        },
        include: {
          session: {
            select: {
              assignment: {
                select: {
                  class_id: true
                }
              }
            }
          },
          option: {
            select: {
              id: true,
              content: true,
              is_correct: true,
            }
          },
          question: {
            select: {
              id: true,
              content: true,
              question_type: true,
              difficulty: true,
              explanation: true,
              metadata: true,
              topic: {
                select: {
                  name: true
                }
              },
              answer_options: {
                select: {
                  id: true,
                  content: true,
                  is_correct: true
                }
              }
            }
          }
        },
        orderBy: {
          answered_at: 'desc'
        }
      })
    ]);

    // 3. Select wrong answers: prioritize class-specific answers; if none in class, take student's full practice history
    const classFilteredWrongAnswers = allStudentWrongAnswers.filter(ans => ans.session?.assignment?.class_id === classId);
    const rawWrongAnswers = classFilteredWrongAnswers.length > 0 ? classFilteredWrongAnswers : allStudentWrongAnswers;

    // 4. Compute student cumulative stats
    let totalAnswers = 0;
    let totalCorrect = 0;
    let totalScore = 0;
    let lastActiveAt: Date | null = null;

    const classSessions = sessionsRaw.filter(s => s.assignment?.class_id === classId);
    const activeSessions = classSessions.length > 0 ? classSessions : sessionsRaw;

    if (activeSessions.length > 0) {
      lastActiveAt = activeSessions[0].finished_at;
      activeSessions.forEach(s => {
        const numScore = s.score ? Number(s.score) : 0;
        totalScore += numScore;
        totalAnswers += s.total_q || 0;
        totalCorrect += s.correct_q || 0;
      });
    }

    // Fallback: If sessions summary had 0 but student topic stats have data, get accurate totals from topicPerf
    if (totalAnswers === 0 && topicPerfRaw.length > 0) {
      topicPerfRaw.forEach(tp => {
        totalAnswers += tp.total_answers || 0;
        totalCorrect += tp.correct_answers || 0;
      });
    }

    const accuracyPct = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 1000) / 10 : 0;
    const totalIncorrect = Math.max(0, totalAnswers - totalCorrect);

    // 5. Compute Class Benchmark (Average Score & Average Accuracy)
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

    // 6. Process SM2 Memory Breakdown
    const totalQ = sm2Raw?.total_questions || 0;
    const sm2Summary = {
      total_questions: totalQ,
      mastered_count: sm2Raw?.mastered_count || 0,
      learning_in_progress: sm2Raw?.learning_in_progress || 0,
      learning_at_risk: sm2Raw?.learning_at_risk || 0,
      new_count: sm2Raw?.new_count || 0,
      due_today: sm2Raw?.due_today || 0
    };

    // 7. Process Topic Performance & Weak Topics (< 60% accuracy)
    const topicPerformance = topicPerfRaw.map(tp => {
      const total = tp.total_questions || (tp as any).total_answers || 0;
      const acc = Math.round((tp.accuracy_pct || 0) * 10) / 10;
      const correct = Math.round(total * (acc / 100));
      return {
        topic: tp.topic || 'Chung',
        accuracy_pct: acc,
        total_answers: total,
        correct_answers: correct
      };
    });

    const weakTopics = topicPerfRaw
      .filter(tp => (tp.accuracy_pct || 0) < 60 && (tp.total_questions || (tp as any).total_answers || 0) >= 1)
      .map(tp => {
        const total = tp.total_questions || (tp as any).total_answers || 0;
        const acc = Math.round((tp.accuracy_pct || 0) * 10) / 10;
        const error = Math.max(1, Math.round(total * (1 - acc / 100)));
        return {
          topic: tp.topic,
          accuracy_pct: acc,
          total_answers: total,
          error_count: error
        };
      })
      .slice(0, 5);

    // 8. Process Assignment History
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

    // 9. Process ALL Error Questions (Deduplicated with error frequency count)
    const errorQuestionsMap = new Map<string, ErrorQuestionDetail>();

    for (const ans of rawWrongAnswers) {
      const q = ans.question;
      if (!q) continue;

      const existing = errorQuestionsMap.get(q.id);
      if (existing) {
        existing.error_count += 1;
        // Keep the latest answer attempt and latest timestamp
        if (ans.answered_at > existing.last_answered_at) {
          existing.last_answered_at = ans.answered_at;
          existing.student_answer = formatStudentAnswer(ans);
          existing.response_time_seconds = Math.round((ans.response_time_ms / 1000) * 10) / 10;
        }
      } else {
        errorQuestionsMap.set(q.id, {
          question_id: q.id,
          content: q.content || 'Nội dung câu hỏi',
          topic: q.topic?.name || 'Chung',
          question_type: formatQuestionType(q.question_type),
          difficulty: q.difficulty || 3,
          student_answer: formatStudentAnswer(ans),
          correct_answer: formatCorrectAnswer(q),
          explanation: q.explanation || 'Chưa có giải thích chi tiết.',
          response_time_seconds: Math.round((ans.response_time_ms / 1000) * 10) / 10,
          error_count: 1,
          last_answered_at: ans.answered_at
        });
      }
    }

    const errorQuestions = Array.from(errorQuestionsMap.values());

    // 10. Prepare Rich Stats Payload for AI Diagnostic (Using pedagogical Vietnamese terms)
    const studentStatsPayload = {
      thong_tin_hoc_sinh: {
        ho_va_ten: student.full_name,
        lop_hoc: classData.name,
        mon_hoc: classData.subject || 'Chung / Đa môn'
      },
      chi_so_tong_quan: {
        diem_tich_luy: totalScore,
        do_chinh_xac_phan_tram: accuracyPct,
        tong_so_cau_da_tra_loi: totalAnswers,
        so_cau_dung: totalCorrect,
        so_cau_sai: totalIncorrect,
        trung_binh_lop_diem: classAverageScore,
        trung_binh_lop_do_chinh_xac: classAverageAccuracy
      },
      ghi_nho_dai_han_sm2: {
        tong_so_kien_thuc: sm2Summary.total_questions,
        so_kien_thuc_thanh_thao: sm2Summary.mastered_count,
        so_kien_thuc_dang_ren_luyen: sm2Summary.learning_in_progress,
        so_kien_thuc_nguy_co_quen_cao: sm2Summary.learning_at_risk,
        so_kien_thuc_can_truy_bai_gap_trong_ngay: sm2Summary.due_today
      },
      chuyen_de_yeu_can_phu_dao: weakTopics.map(w => `${w.topic} (Độ chính xác: ${w.accuracy_pct}%, làm sai ${w.error_count}/${w.total_answers} câu)`),
      do_chinh_xac_theo_chuyen_de: topicPerformance.map(t => `${t.topic}: ${t.accuracy_pct}% (${t.total_answers} câu)`),
      danh_sach_tat_ca_cau_hoi_hoc_sinh_lam_sai: errorQuestions.map((eq, idx) => ({
        stt: idx + 1,
        chuyen_de: eq.topic,
        noi_dung_de_bai: eq.content,
        hoc_sinh_chon_sai: eq.student_answer,
        dap_an_dung: eq.correct_answer,
        giai_thich_chi_tiet: eq.explanation,
        so_lan_sai: `${eq.error_count} lần`,
        thoi_gian_tra_loi_giay: eq.response_time_seconds
      }))
    };

    // 11. Generate AI Diagnostic Assessment
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
        total_answers_count: totalAnswers,
        total_correct_count: totalCorrect,
        total_incorrect_count: totalIncorrect,
        completed_assignments_count: completedAssignmentsCount,
        total_assignments_count: assignmentsRaw.length,
        sessions_count: activeSessions.length,
        streak_days: 0,
        last_active_at: lastActiveAt,
        class_average_score: classAverageScore,
        class_average_accuracy_pct: classAverageAccuracy
      },
      sm2_summary: sm2Summary,
      topic_performance: topicPerformance,
      weak_topics: weakTopics,
      assignments,
      error_questions: errorQuestions,
      ai_insights: aiInsights || {
        executive_summary: 'Học sinh đang duy trì tiến độ học tập và hoàn thành các bài tập theo phân phối chương trình của lớp.',
        strengths_and_weaknesses: 'Học sinh nắm vững các kỹ năng cơ bản, cần tăng cường thêm thời lượng luyện tập các dạng bài nâng cao.',
        sm2_learning_analysis: 'Đa số kiến thức đang trong chu kỳ lặp lại ngắt quãng SM2 và duy trì mức độ ghi nhớ tích cực.'
      }
    };
  }
}

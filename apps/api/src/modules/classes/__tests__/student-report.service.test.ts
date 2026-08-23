import { StudentReportService } from '../student-report.service';
import { PrismaClient } from '@prisma/client';
import { AnalyticsRepository } from '../../analytics/analytics.repository';
import { AiService } from '../../ai/ai.service';

describe('StudentReportService', () => {
  let studentReportService: StudentReportService;
  let mockPrisma: any;
  let mockAnalyticsRepo: any;
  let mockAiService: any;

  beforeEach(() => {
    mockPrisma = {
      class: {
        findUnique: jest.fn(),
      },
      assignment: {
        findMany: jest.fn(),
      },
      quizSession: {
        findMany: jest.fn(),
      },
      sessionAnswer: {
        findMany: jest.fn(),
      }
    };

    mockAnalyticsRepo = {
      getSM2Summary: jest.fn(),
      getTopicPerformance: jest.fn(),
      getTeacherClassStudents: jest.fn(),
    };

    mockAiService = {
      generatePersonalizedStudentReport: jest.fn(),
    };

    studentReportService = new StudentReportService(
      mockPrisma as unknown as PrismaClient,
      mockAnalyticsRepo as unknown as AnalyticsRepository,
      mockAiService as unknown as AiService
    );
    jest.clearAllMocks();
  });

  it('should return null if class not found or teacher is not owner', async () => {
    mockPrisma.class.findUnique.mockResolvedValue(null);

    const result = await studentReportService.getStudentReportData('class-1', 'student-1', 'teacher-1');
    expect(result).toBeNull();
  });

  it('should aggregate student stats, benchmark, SM2, error questions and AI insights correctly', async () => {
    mockPrisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      name: 'Lớp 10A1',
      subject: 'Tiếng Anh',
      teacher_id: 'teacher-1',
      teacher: { full_name: 'Thầy Hùng', email: 'hung@school.edu' },
      members: [{
        student: {
          id: 'student-1',
          full_name: 'Nguyễn Văn A',
          email: 'nva@school.edu',
          avatar_url: null,
        }
      }]
    });

    mockAnalyticsRepo.getSM2Summary.mockResolvedValue({
      total_questions: 50,
      mastered_count: 35,
      learning_in_progress: 10,
      learning_at_risk: 5,
      new_count: 0,
      due_today: 4
    });

    mockAnalyticsRepo.getTopicPerformance.mockResolvedValue([
      { topic: 'Thì Quá Khứ Hoàn Thành', accuracy_pct: 45.0, total_answers: 10, correct_answers: 4 },
      { topic: 'Động vật', accuracy_pct: 90.0, total_answers: 20, correct_answers: 18 }
    ]);

    mockAnalyticsRepo.getTeacherClassStudents.mockResolvedValue([
      { student_id: 'student-1', score: 85, accuracy: 80 },
      { student_id: 'student-2', score: 65, accuracy: 60 }
    ]);

    mockPrisma.assignment.findMany.mockResolvedValue([
      {
        id: 'assign-1',
        title: 'Bài tập tuần 1',
        quiz_sessions: [{ score: 90, total_q: 10, correct_q: 9, finished_at: new Date('2026-08-20') }]
      }
    ]);

    mockPrisma.quizSession.findMany.mockResolvedValue([
      { score: 90, total_q: 10, correct_q: 9, finished_at: new Date('2026-08-20') }
    ]);

    mockPrisma.sessionAnswer.findMany.mockResolvedValue([
      {
        id: 'sa-1',
        response_time_ms: 12500,
        answered_at: new Date('2026-08-20T10:00:00Z'),
        option: { content: 'has gone', is_correct: false },
        question: {
          id: 'q-1',
          content: 'She ___ to Paris last year.',
          type: 'multiple_choice',
          difficulty: 3,
          explanation: 'Dùng quá khứ đơn "went" vì có dấu hiệu last year.',
          topic: { name: 'Thì Quá Khứ' },
          answer_options: [
            { id: 'opt-1', content: 'went', is_correct: true },
            { id: 'opt-2', content: 'has gone', is_correct: false }
          ]
        }
      }
    ]);

    mockAiService.generatePersonalizedStudentReport.mockResolvedValue({
      executive_summary: 'Học sinh có kết quả học tập tốt.',
      strengths_and_weaknesses: 'Nắm vững từ vựng cơ bản nhưng nhầm lẫn thì quá khứ.',
      sm2_learning_analysis: 'Trí nhớ dài hạn phát triển tốt.'
    });

    const result = await studentReportService.getStudentReportData('class-1', 'student-1', 'teacher-1');

    expect(result).not.toBeNull();
    expect(result?.student_info.name).toBe('Nguyễn Văn A');
    expect(result?.summary.accuracy_pct).toBe(90);
    expect(result?.summary.class_average_score).toBe(75);
    expect(result?.summary.class_average_accuracy_pct).toBe(70);
    expect(result?.weak_topics.length).toBe(1);
    expect(result?.weak_topics[0].topic).toBe('Thì Quá Khứ Hoàn Thành');
    expect(result?.error_questions.length).toBe(1);
    expect(result?.error_questions[0].student_answer).toBe('has gone');
    expect(result?.error_questions[0].correct_answer).toBe('went');
    expect(result?.ai_insights.executive_summary).toBe('Học sinh có kết quả học tập tốt.');
  });
});

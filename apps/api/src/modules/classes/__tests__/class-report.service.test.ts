import { ClassReportService } from '../class-report.service';
import { AnalyticsRepository } from '../../analytics/analytics.repository';
import { AiService } from '../../ai/ai.service';
import { PrismaClient } from '@prisma/client';

describe('ClassReportService.getCompleteReportData', () => {
  let reportService: ClassReportService;
  let mockPrisma: any;
  let mockAnalyticsRepo: any;
  let mockAiService: any;

  beforeEach(() => {
    mockPrisma = {
      class: {
        findUnique: jest.fn(),
      }
    };

    mockAnalyticsRepo = {
      countActiveClassMembers: jest.fn(),
      getTeacherClassActiveStudents: jest.fn(),
      getTeacherClassAverageScore: jest.fn(),
      getTeacherClassSM2Summary: jest.fn(),
      getTeacherClassTopics: jest.fn(),
      getTeacherClassStudents: jest.fn(),
    };

    mockAiService = {
      generateComprehensiveClassReport: jest.fn(),
    };

    reportService = new ClassReportService(
      mockPrisma as unknown as PrismaClient,
      mockAnalyticsRepo as unknown as AnalyticsRepository,
      mockAiService as unknown as AiService
    );
  });

  it('should return null if class does not exist or teacher does not own class', async () => {
    mockPrisma.class.findUnique.mockResolvedValue(null);

    const result = await reportService.getCompleteReportData('non-existent-class', 'teacher-1');
    expect(result).toBeNull();
  });

  it('should aggregate all class data and generate AI insights successfully', async () => {
    mockPrisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      name: 'Tiếng Anh Giao Tiếp 10A1',
      subject: 'Tiếng Anh',
      join_code: 'ENG10A',
      description: 'Lớp nâng cao',
      created_at: new Date('2026-01-10'),
      teacher_id: 'teacher-1',
      teacher: {
        full_name: 'Thầy Nguyễn Văn A',
        email: 'teacher@school.edu.vn'
      }
    });

    mockAnalyticsRepo.countActiveClassMembers.mockResolvedValue(30);
    mockAnalyticsRepo.getTeacherClassActiveStudents.mockResolvedValue([{ active_count: 27 }]);
    mockAnalyticsRepo.getTeacherClassAverageScore.mockResolvedValue([{ avg_score: 8.4 }]);
    mockAnalyticsRepo.getTeacherClassSM2Summary.mockResolvedValue({
      total_questions: 150,
      new_count: 20,
      learning_count: 40,
      learning_at_risk: 5,
      learning_in_progress: 35,
      mastered_count: 90,
      due_today: 12
    });
    mockAnalyticsRepo.getTeacherClassTopics.mockResolvedValue([
      { topic_id: 'top-1', topic: 'Thì Quá khứ đơn', accuracy_pct: 85, total_answers: 300, avg_ef: 2.6, mastered_count: 40, at_risk_count: 2 },
      { topic_id: 'top-2', topic: 'Câu điều kiện loại 2', accuracy_pct: 55, total_answers: 250, avg_ef: 2.1, mastered_count: 15, at_risk_count: 8 }
    ]);
    mockAnalyticsRepo.getTeacherClassStudents.mockResolvedValue([
      { student_id: 'st-1', name: 'Trần Văn B', score: 95, sessions_count: 10, accuracy: 92, last_active_at: new Date(), sm2_total_q: 150, sm2_mastered_q: 90, sm2_avg_ef: 2.7 }
    ]);

    mockAiService.generateComprehensiveClassReport.mockResolvedValue({
      executive_summary: 'Lớp học có kết quả rất tốt.',
      strengths_and_weaknesses: 'Nắm chắc kiến thức thì quá khứ.',
      sm2_learning_analysis: 'Trí nhớ dài hạn ổn định.',
      pedagogical_action_plan: ['Củng cố câu điều kiện loại 2.']
    });

    const report = await reportService.getCompleteReportData('class-1', 'teacher-1');

    expect(report).toBeDefined();
    expect(report?.class_info.name).toBe('Tiếng Anh Giao Tiếp 10A1');
    expect(report?.summary.total_students).toBe(30);
    expect(report?.summary.active_students_7d).toBe(27);
    expect(report?.summary.average_score).toBe(8.4);
    expect(report?.topics.length).toBe(2);
    expect(report?.students.length).toBe(1);
    expect(report?.ai_insights.executive_summary).toBe('Lớp học có kết quả rất tốt.');
  });
});

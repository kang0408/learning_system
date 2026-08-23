import { PdfGeneratorService } from '../pdf-generator.service';
import { CompleteStudentReportData } from '../student-report.service';
import { closeBrowserInstance } from '../../../lib/puppeteer';

describe('PdfGeneratorService - Student Report', () => {
  let pdfGeneratorService: PdfGeneratorService;

  beforeEach(() => {
    pdfGeneratorService = new PdfGeneratorService();
  });

  afterAll(async () => {
    await closeBrowserInstance();
  });

  it('should generate valid PDF buffer from complete student report data', async () => {
    const mockData: CompleteStudentReportData = {
      student_info: {
        id: 'student-123',
        name: 'Trần Khang',
        email: 'khang@test.com',
        avatar_url: null,
      },
      class_info: {
        id: 'class-123',
        name: 'Lớp Luyện Thi IELTS K1',
        subject: 'Tiếng Anh',
        teacher_name: 'Thầy Nguyễn Văn A',
        teacher_email: 'gv@test.com',
      },
      generated_at: new Date(),
      summary: {
        cumulative_score: 180,
        accuracy_pct: 82.5,
        total_answers_count: 50,
        total_correct_count: 41,
        total_incorrect_count: 9,
        completed_assignments_count: 5,
        total_assignments_count: 6,
        sessions_count: 10,
        streak_days: 3,
        last_active_at: new Date(),
        class_average_score: 150,
        class_average_accuracy_pct: 75.0,
      },
      sm2_summary: {
        total_questions: 45,
        mastered_count: 32,
        learning_in_progress: 8,
        learning_at_risk: 3,
        new_count: 2,
        due_today: 4,
      },
      topic_performance: [
        { topic: 'Thì Quá Khứ', accuracy_pct: 45.0, total_answers: 10, correct_answers: 4 },
        { topic: 'Từ Vựng Học Thuật', accuracy_pct: 88.0, total_answers: 20, correct_answers: 18 }
      ],
      weak_topics: [
        { topic: 'Thì Quá Khứ', accuracy_pct: 45.0, total_answers: 10, error_count: 6 }
      ],
      assignments: [
        {
          assignment_id: 'a-1',
          title: 'Bài tập 1: Ngữ pháp căn bản',
          score: 85,
          accuracy_pct: 85.0,
          attempts_count: 1,
          status: 'Hoàn thành',
          completed_at: new Date()
        }
      ],
      error_questions: [
        {
          question_id: 'q-1',
          content: 'She ___ to Paris last summer.',
          topic: 'Thì Quá Khứ',
          question_type: 'Trắc nghiệm',
          difficulty: 3,
          student_answer: 'has gone',
          correct_answer: 'went',
          explanation: 'Dùng quá khứ đơn "went" vì có mốc thời gian xác định "last summer".',
          response_time_seconds: 14.5,
          error_count: 2,
          last_answered_at: new Date()
        }
      ],
      ai_insights: {
        executive_summary: 'Học sinh có ý thức học tập tốt và theo kịp tiến độ chương trình.',
        strengths_and_weaknesses: 'Nắm vững từ vựng nhưng cần ôn tập kỹ thì quá khứ.',
        sm2_learning_analysis: 'Đa số kiến thức đang trong chu kỳ Spaced Repetition ổn định.'
      }
    };

    const pdfBuffer = await pdfGeneratorService.generateStudentReportPdf(mockData);

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // PDF Magic bytes check: %PDF-
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-');
  }, 30000);
});

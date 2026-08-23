import { PdfGeneratorService } from '../pdf-generator.service';
import { CompleteClassReportData } from '../class-report.service';
import { closeBrowserInstance } from '../../../lib/puppeteer';

describe('PdfGeneratorService', () => {
  let pdfService: PdfGeneratorService;

  beforeAll(() => {
    pdfService = new PdfGeneratorService();
  });

  afterAll(async () => {
    await closeBrowserInstance();
  });

  it('should generate valid PDF buffer from complete class report data', async () => {
    const mockReportData: CompleteClassReportData = {
      class_info: {
        id: 'c-1',
        name: 'Lớp 10A1',
        subject: 'Tiếng Anh',
        join_code: 'ENG101',
        description: 'Lớp học thử nghiệm',
        created_at: new Date(),
        teacher_name: 'Nguyễn Văn A',
        teacher_email: 'teacher@test.com',
      },
      generated_at: new Date(),
      summary: {
        total_students: 20,
        active_students_7d: 18,
        active_rate_pct: 90,
        average_score: 8.5,
        completion_rate_pct: 90,
      },
      sm2_summary: {
        total_questions: 100,
        new_count: 10,
        new_pct: 10,
        learning_count: 30,
        learning_pct: 30,
        learning_at_risk: 5,
        learning_in_progress: 25,
        mastered_count: 60,
        mastered_pct: 60,
        due_today: 8,
      },
      topics: [
        { topic_id: 't-1', topic: 'Thì Hiện tại hoàn thành', accuracy_pct: 80, total_answers: 200, avg_ef: 2.6, mastered_count: 50, at_risk_count: 3 },
      ],
      students: [
        { student_id: 's-1', name: 'Học sinh 1', score: 90, sessions_count: 5, accuracy: 88, last_active_at: new Date(), sm2_total_q: 50, sm2_mastered_q: 40, sm2_avg_ef: 2.7 },
      ],
      ai_insights: {
        executive_summary: 'Lớp học có tiến độ học tập xuất sắc trong học kỳ vừa qua.',
        strengths_and_weaknesses: 'Nắm vững các thì cơ bản, cần bổ trợ thêm từ vựng nâng cao.',
        sm2_learning_analysis: 'Chỉ số ghi nhớ Spaced Repetition ổn định ở mức 60% mức độ thuần thục.',
        pedagogical_action_plan: ['Tổ chức luyện tập định kỳ', 'Giao bài tập bổ trợ'],
      }
    };

    const pdfBuffer = await pdfService.generateClassReportPdf(mockReportData);

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000); // PDF file header & body
    // PDF Magic bytes check (%PDF-)
    expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
  }, 45000);
});

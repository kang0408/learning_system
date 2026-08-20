import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { AiService } from '../../ai/ai.service';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: (...args: any[]) => mockGenerateContent(...args),
    },
  })),
  Type: {
    OBJECT: 'OBJECT',
    ARRAY: 'ARRAY',
    STRING: 'STRING',
    INTEGER: 'INTEGER',
    BOOLEAN: 'BOOLEAN',
  },
}));


jest.mock('../../../lib/prisma', () => ({
  prisma: {
    question: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    topic: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    answerOption: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => {
      if (typeof cb === 'function') {
        return cb(prisma);
      }
      return Promise.all(cb);
    }),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_1234567890123456';
const teacherId = 'teacher-uuid-1';
const teacherToken = jwt.sign({ userId: teacherId, role: 'teacher' }, JWT_SECRET);

const topicId = '11111111-1111-4111-a111-111111111111';

describe('Questions & Gemini AI Test Suite (Section 4.2.4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC_QST_01: Tạo câu hỏi thủ công đa dạng định dạng', () => {
    it('should create a multiple-choice question and return 201', async () => {
      (prisma.topic.findFirst as jest.Mock).mockResolvedValue({ id: topicId, name: 'English Grammar' });
      (prisma.question.create as jest.Mock).mockResolvedValue({
        id: 'q-1',
        content: 'She _____ to London last summer.',
        question_type: 'multiple_choice',
        difficulty: 3,
        explanation: 'Thì quá khứ đơn diễn tả hành động đã hoàn thành trong quá khứ.',
        topic_id: topicId,
        created_by: teacherId,
        answer_options: [
          { id: 'opt-1', content: 'go', is_correct: false },
          { id: 'opt-2', content: 'went', is_correct: true },
          { id: 'opt-3', content: 'gone', is_correct: false },
          { id: 'opt-4', content: 'going', is_correct: false },
        ],
      });

      const res = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          content: 'She _____ to London last summer.',
          question_type: 'multiple_choice',
          difficulty: 3,
          explanation: 'Thì quá khứ đơn diễn tả hành động đã hoàn thành trong quá khứ.',
          topic_id: topicId,
          answer_options: [
            { content: 'go', is_correct: false, order_index: 0 },
            { content: 'went', is_correct: true, order_index: 1 },
            { content: 'gone', is_correct: false, order_index: 2 },
            { content: 'going', is_correct: false, order_index: 3 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('q-1');
      expect(res.body.data.question_type).toBe('multiple_choice');
    });

    it('should create matching question with pairs metadata', async () => {
      (prisma.topic.findFirst as jest.Mock).mockResolvedValue({ id: topicId, name: 'Vocab' });
      (prisma.question.create as jest.Mock).mockResolvedValue({
        id: 'q-2',
        content: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng',
        question_type: 'matching',
        difficulty: 2,
        metadata: {
          pairs: [
            { leftId: '1', leftText: 'Apple', rightId: '1', rightText: 'Quả táo' },
            { leftId: '2', leftText: 'Banana', rightId: '2', rightText: 'Quả chuối' },
          ],
        },
      });

      const res = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          content: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng',
          question_type: 'matching',
          difficulty: 2,
          topic_id: topicId,
          metadata: {
            pairs: [
              { leftText: 'Apple', rightText: 'Quả táo' },
              { leftText: 'Banana', rightText: 'Quả chuối' },
            ],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.question_type).toBe('matching');
    });
  });

  describe('TC_QST_02: Tự động sinh câu hỏi bằng Google Gemini AI', () => {
    it('should generate structured questions using Gemini AI and return them', async () => {
      const mockGeneratedQuestions = [
        {
          content: 'I have known him _____ 2015.',
          question_type: 'multiple_choice',
          difficulty: 3,
          explanation: 'Dùng "since" với mốc thời gian.',
          answer_options: [
            { content: 'for', is_correct: false },
            { content: 'since', is_correct: true },
            { content: 'in', is_correct: false },
            { content: 'at', is_correct: false },
          ],
        },
        {
          content: 'They have lived here _____ 5 years.',
          question_type: 'multiple_choice',
          difficulty: 3,
          explanation: 'Dùng "for" với khoảng thời gian.',
          answer_options: [
            { content: 'for', is_correct: true },
            { content: 'since', is_correct: false },
            { content: 'during', is_correct: false },
            { content: 'ago', is_correct: false },
          ],
        },
        {
          content: 'She has already finished her homework.',
          question_type: 'true_false',
          difficulty: 2,
          explanation: '"Already" đứng giữa trợ động từ và quá khứ phân từ.',
          answer_options: [
            { content: 'Đúng', is_correct: true },
            { content: 'Sai', is_correct: false },
          ],
        },
      ];

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockGeneratedQuestions),
      });

      const res = await request(app)
        .post('/api/questions/generate-ai')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          topic: 'English Grammar - Present Perfect',
          question_type: 'mixed',
          quantity: 3,
          difficulty: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].content).toContain('known him');
    });
  });

  describe('TC_QST_03: Kiểm tra cơ chế Cache lời giải thích AI (Redis Cache)', () => {
    it('should return explanation from Redis cache when available (Cache Hit)', async () => {
      const mockCacheRepo = {
        get: jest.fn().mockResolvedValue('Cached explanation: Chọn went vì có dấu hiệu last summer.'),
        setEx: jest.fn(),
      };
      const mockAiRepo = {} as any;

      const aiService = new AiService(mockCacheRepo as any, mockAiRepo);
      const explanation = await aiService.getExplanation('q-1', 'opt-1', 'She _____ to London last summer.');

      expect(explanation).toBe('Cached explanation: Chọn went vì có dấu hiệu last summer.');
      expect(mockCacheRepo.get).toHaveBeenCalledWith('ai:explanation:q-1:opt-1');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('should query Gemini AI on cache miss and save to Redis with 30-day TTL', async () => {
      const mockCacheRepo = {
        get: jest.fn().mockResolvedValue(null),
        setEx: jest.fn().mockResolvedValue('OK'),
      };
      const mockAiRepo = {} as any;

      mockGenerateContent.mockResolvedValue({
        text: 'Đáp án sai do thì quá khứ đơn cần dùng V2.',
      });

      const aiService = new AiService(mockCacheRepo as any, mockAiRepo);
      const explanation = await aiService.getExplanation('q-1', 'opt-1', 'She _____ to London last summer.');

      expect(explanation).toBe('Đáp án sai do thì quá khứ đơn cần dùng V2.');
      expect(mockCacheRepo.setEx).toHaveBeenCalledWith('ai:explanation:q-1:opt-1', 30 * 24 * 60 * 60, 'Đáp án sai do thì quá khứ đơn cần dùng V2.');
    });
  });

  describe('TC_QST_04: Nhập câu hỏi từ tệp CSV', () => {
    it('should parse CSV file and import questions into database', async () => {
      const csvContent = `Nội dung câu hỏi,Loại câu hỏi,Độ khó,Giải thích,Mã Chủ đề (Code),Đáp án Đúng,Đáp án 1,Đáp án 2,Đáp án 3,Đáp án 4
He _____ soccer yesterday.,multiple_choice,3,Yesterday là quá khứ đơn,GRAMMAR,B,plays,played,playing,has played`;

      (prisma.topic.findFirst as jest.Mock).mockResolvedValue({ id: 'topic-grammar', code: 'GRAMMAR' });
      (prisma.question.create as jest.Mock).mockResolvedValue({ id: 'q-csv-1' });

      const res = await request(app)
        .post('/api/questions/import-csv')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('file', Buffer.from(csvContent, 'utf-8'), 'questions.csv');

      expect(res.status).toBe(200);
      expect(res.body.data.importedCount).toBe(1);
    });
  });

  describe('TC_QST_05: Xử lý lỗi khi Gemini AI mất kết nối / Lỗi API', () => {
    it('should gracefully handle Gemini API errors in getExplanation and return null', async () => {
      const mockCacheRepo = {
        get: jest.fn().mockResolvedValue(null),
        setEx: jest.fn(),
      };
      const mockAiRepo = {} as any;

      mockGenerateContent.mockRejectedValue(new Error('Google Gemini API Quota Exceeded / Network Error'));

      const aiService = new AiService(mockCacheRepo as any, mockAiRepo);
      const explanation = await aiService.getExplanation('q-err', 'opt-err', 'Context');

      expect(explanation).toBeNull();
    });
  });

  describe('Quản lý ngân hàng câu hỏi (CRUD)', () => {
    it('should list questions with pagination and filters', async () => {
      (prisma.question.findMany as jest.Mock).mockResolvedValue([
        { id: 'q-1', content: 'Question 1', created_by: teacherId },
      ]);
      (prisma.question.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/questions?page=1&limit=10&difficulty=3')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('should toggle question publication status', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({
        id: 'q-1',
        is_public: false,
        created_by: teacherId,
      });
      (prisma.question.update as jest.Mock).mockResolvedValue({
        id: 'q-1',
        is_public: true,
      });

      const res = await request(app)
        .patch('/api/questions/q-1/publish')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
    });

    it('should delete a question (soft-delete)', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({
        id: 'q-1',
        created_by: teacherId,
      });
      (prisma.question.update as jest.Mock).mockResolvedValue({
        id: 'q-1',
        deleted_at: new Date(),
      });

      const res = await request(app)
        .delete('/api/questions/q-1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
    });
  });
});

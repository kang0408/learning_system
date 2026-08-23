import { AiService } from '../ai.service';
import { AiCacheRepository } from '../ai-cache.repository';
import { AiRepository } from '../ai.repository';

jest.mock('../gemini-fallback', () => ({
  generateContentWithFallback: jest.fn()
}));

const { generateContentWithFallback } = require('../gemini-fallback');

describe('AiService.generateComprehensiveClassReport', () => {
  let aiService: AiService;
  let mockCacheRepo: jest.Mocked<AiCacheRepository>;
  let mockAiRepo: jest.Mocked<AiRepository>;

  beforeEach(() => {
    mockCacheRepo = {
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
    } as any;

    mockAiRepo = {
      saveClassReport: jest.fn(),
      getLatestClassReport: jest.fn(),
    } as any;

    aiService = new AiService(mockCacheRepo, mockAiRepo);
    jest.clearAllMocks();
  });

  it('should return cached report if available in Redis', async () => {
    const cachedData = {
      executive_summary: 'Lớp học có kết quả học tập ổn định trong kỳ vừa qua.',
      strengths_and_weaknesses: 'Nắm chắc kiến thức Từ vựng nhưng cần cải thiện Ngữ pháp nâng cao.',
      sm2_learning_analysis: 'Tỷ lệ ghi nhớ dài hạn đạt mức 65%, có 12% câu hỏi thuộc vùng nguy cơ quên.',
      pedagogical_action_plan: [
        'Dành 20 phút đầu giờ ôn tập thì quá khứ hoàn thành.',
        'Giao bài tập bổ trợ 15 câu phân hóa theo nhóm học sinh.',
        'Kèm cặp trực tiếp nhóm 3 học sinh có nguy cơ quên kiến thức cao.'
      ]
    };

    mockCacheRepo.get.mockResolvedValue(JSON.stringify(cachedData));

    const result = await aiService.generateComprehensiveClassReport('class-123', { total_students: 25 });

    expect(result).toEqual(cachedData);
    expect(mockCacheRepo.get).toHaveBeenCalledTimes(1);
    expect(generateContentWithFallback).not.toHaveBeenCalled();
  });

  it('should call Gemini API with fallback and cache result when cache misses', async () => {
    mockCacheRepo.get.mockResolvedValue(null);

    const generatedAiResponse = {
      executive_summary: 'Lớp học có kết quả học tập rất tích cực với 88% học sinh hoàn thành bài tập.',
      strengths_and_weaknesses: 'Lớp làm chủ tốt chủ đề Giao tiếp cơ bản, còn yếu ở phần Nghe hiểu.',
      sm2_learning_analysis: 'Trí nhớ dài hạn SM2 phát triển đều, số lượng câu hỏi cần ôn tập hôm nay là 14.',
      pedagogical_action_plan: [
        'Tăng cường các bài tập nghe có phụ đề ngắt đoạn.',
        'Tạo bài kiểm tra nhanh củng cố từ vựng chuyên ngành.'
      ]
    };

    (generateContentWithFallback as jest.Mock).mockResolvedValue({
      response: {
        text: JSON.stringify(generatedAiResponse)
      }
    });

    const result = await aiService.generateComprehensiveClassReport('class-123', {
      class_name: 'Tiếng Anh 10A1',
      total_students: 30,
      average_score: 8.2
    });

    expect(result).toEqual(generatedAiResponse);
    expect(mockCacheRepo.get).toHaveBeenCalled();
    expect(generateContentWithFallback).toHaveBeenCalled();
    expect(mockCacheRepo.setEx).toHaveBeenCalledWith(
      expect.stringContaining('ai:class-report:comprehensive:class-123:'),
      86400,
      expect.any(String)
    );
  });
});

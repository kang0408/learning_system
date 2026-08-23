import { AiService } from '../ai.service';
import { AiCacheRepository } from '../ai-cache.repository';
import { AiRepository } from '../ai.repository';

jest.mock('../gemini-fallback', () => ({
  generateContentWithFallback: jest.fn()
}));

const { generateContentWithFallback } = require('../gemini-fallback');

describe('AiService.generatePersonalizedStudentReport', () => {
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
      saveStudentReport: jest.fn(),
      getLatestStudentReport: jest.fn(),
    } as any;

    aiService = new AiService(mockCacheRepo, mockAiRepo);
    jest.clearAllMocks();
  });

  it('should return cached report if available in Redis', async () => {
    const cachedData = {
      executive_summary: 'Học sinh thể hiện năng lực tiếp thu tốt, duy trì làm bài tập đều đặn.',
      strengths_and_weaknesses: 'Nắm vững từ vựng cơ bản nhưng còn lúng túng ở các cấu trúc đảo ngữ.',
      sm2_learning_analysis: 'Đã làm chủ 35/40 câu hỏi, cần ôn tập 5 câu hỏi có nguy cơ quên trong tuần này.'
    };

    mockCacheRepo.get.mockResolvedValue(JSON.stringify(cachedData));

    const result = await aiService.generatePersonalizedStudentReport('class-123', 'student-456', { student_name: 'Nguyễn Văn A' });

    expect(result).toEqual(cachedData);
    expect(mockCacheRepo.get).toHaveBeenCalledTimes(1);
    expect(generateContentWithFallback).not.toHaveBeenCalled();
  });

  it('should call Gemini API with fallback and cache result when cache misses', async () => {
    mockCacheRepo.get.mockResolvedValue(null);

    const generatedAiResponse = {
      executive_summary: 'Học sinh có tinh thần tự học cao, điểm số trên mức trung bình lớp.',
      strengths_and_weaknesses: 'Điểm mạnh ở kỹ năng đọc hiểu, cần cải thiện chuyên đề Ngữ pháp thì quá khứ.',
      sm2_learning_analysis: 'Khoảng cách lặp lại ngắt quãng SM2 đạt chuẩn, 80% kiến thức đã ghi nhớ vững chắc.'
    };

    (generateContentWithFallback as jest.Mock).mockResolvedValue({
      response: {
        text: JSON.stringify(generatedAiResponse)
      }
    });

    const result = await aiService.generatePersonalizedStudentReport('class-123', 'student-456', {
      student_name: 'Trần Khang',
      cumulative_score: 85,
      accuracy: 88,
      weak_topics: ['Thì Quá Khứ Hoàn Thành']
    });

    expect(result).toEqual(generatedAiResponse);
    expect(mockCacheRepo.get).toHaveBeenCalled();
    expect(generateContentWithFallback).toHaveBeenCalled();
    expect(mockCacheRepo.setEx).toHaveBeenCalledWith(
      expect.stringContaining('ai:student-report:diagnostic:class-123:student-456:'),
      86400,
      expect.any(String)
    );
  });
});

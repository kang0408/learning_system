import { GoogleGenAI, Type } from '@google/genai';
import { AiCacheRepository } from './ai-cache.repository';
import { AiRepository } from './ai.repository';
import { config } from '../../config';
import * as Sentry from '@sentry/node';

export class AiService {
  private ai: GoogleGenAI;

  constructor(
    private readonly aiCacheRepo: AiCacheRepository,
    private readonly aiRepo: AiRepository
  ) {
    this.ai = new GoogleGenAI({ apiKey: config.ai.geminiApiKey });
  }

  /**
   * Generates a short explanation for a wrong answer and caches it in Redis.
   */
  async getExplanation(questionId: string, wrongOptionId: string, questionContext: string): Promise<string | null> {
    const cacheKey = `ai:explanation:${questionId}:${wrongOptionId}`;
    
    try {
      // 1. Check Cache
      const cached = await this.aiCacheRepo.get(cacheKey);
      if (cached) return cached;

      // 2. Cache Miss -> Call Gemini API
      const prompt = `Học sinh trả lời sai câu hỏi: "${questionContext}". Hãy giải thích ngắn gọn, dễ hiểu trong 2 câu vì sao đáp án này sai và gợi ý cách nhớ. Chỉ liệt kệ giải thích và cách nhớ, không có gì khác`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      const explanation = response.text;

      // 3. Update Cache (TTL: 30 days)
      if (explanation) {
        await this.aiCacheRepo.setEx(cacheKey, 30 * 24 * 60 * 60, explanation);
      }

      return explanation || null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  /**
   * Generates a nightly report for a student based on their stats
   */
  async generateStudentReport(stats: any): Promise<any> {
    try {
      const prompt = `Dưới đây là số liệu thống kê học tập của một học sinh:
${JSON.stringify(stats)}

Hãy viết một đoạn tóm tắt ngắn (1-2 câu) khích lệ học sinh và một lời khuyên tập trung cải thiện điểm yếu. 
Trả về JSON định dạng: { "summary": "...", "focus_advice": "..." }`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      // Simple extraction of JSON from response (in case of markdown blocks)
      const text = response.text || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : "{}";
      
      return JSON.parse(jsonStr);
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  /**
   * Generates a nightly report for a class based on aggregated stats
   */
  async generateClassReport(stats: any): Promise<any> {
    try {
      const prompt = `Dưới đây là số liệu thống kê học tập tổng hợp của một lớp học:
${JSON.stringify(stats)}

Hãy viết một báo cáo cho giáo viên (1-2 câu) về tình trạng chung của lớp và một lời khuyên sư phạm để cải thiện.
Trả về JSON định dạng: { "class_status": "...", "pedagogical_advice": "..." }`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      const text = response.text || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : "{}";
      
      return JSON.parse(jsonStr);
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }
  /**
   * Generates quiz questions based on topic, type, quantity, and difficulty
   */
  async generateQuizQuestions(params: { topic: string; question_type: string; quantity: number; difficulty?: number }) {
    try {
      const typeStr = params.question_type === 'multiple_choice' ? 'trắc nghiệm (4 đáp án)' : params.question_type === 'true_false' ? 'đúng/sai (2 đáp án)' : 'tổng hợp (trắc nghiệm và đúng/sai)';
      const difficultyStr = params.difficulty ? `${params.difficulty}/5 sao` : 'ngẫu nhiên';
      
      const prompt = `Bạn là một chuyên gia giáo dục. Hãy tạo ${params.quantity} câu hỏi dạng ${typeStr} cho chủ đề "${params.topic}". Độ khó: ${difficultyStr}. Nội dung giải thích cần chi tiết.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: { type: Type.STRING },
                question_type: { type: Type.STRING },
                difficulty: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
                answer_options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      content: { type: Type.STRING },
                      is_correct: { type: Type.BOOLEAN }
                    }
                  }
                }
              },
              required: ["content", "question_type", "difficulty", "explanation", "answer_options"]
            }
          }
        }
      });

      const jsonString = response.text || "[]";
      return JSON.parse(jsonString);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
}

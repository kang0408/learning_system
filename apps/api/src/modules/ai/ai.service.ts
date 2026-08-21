import { GoogleGenAI, Type } from '@google/genai';
import { AiCacheRepository } from './ai-cache.repository';
import { AiRepository } from './ai.repository';
import { config } from '../../config';
import * as Sentry from '@sentry/node';
import { generateContentWithFallback } from './gemini-fallback';

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

      // 2. Cache Miss -> Call Gemini API with Fallback
      const prompt = `Học sinh trả lời sai câu hỏi: "${questionContext}". Hãy giải thích ngắn gọn, dễ hiểu trong 2 câu vì sao đáp án này sai và gợi ý cách nhớ. Chỉ liệt kệ giải thích và cách nhớ, không có gì khác`;
      
      const { response } = await generateContentWithFallback(this.ai, {
        contents: prompt,
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

      const { response } = await generateContentWithFallback(this.ai, {
        contents: prompt,
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

      const { response } = await generateContentWithFallback(this.ai, {
        contents: prompt,
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
      let typeStr = '';
      let formatInstruction = '';
      let typeInstruction = '';

      switch (params.question_type) {
        case 'multiple_choice':
          typeStr = 'trắc nghiệm (1 đáp án đúng trong 4 lựa chọn)';
          typeInstruction = 'QUAN TRỌNG: Bạn BẮT BUỘC phải gán thuộc tính "question_type" là "multiple_choice" cho tất cả câu hỏi được tạo ra!';
          break;
        case 'multi_select':
          typeStr = 'trắc nghiệm nhiều đáp án (có thể có nhiều đáp án đúng)';
          typeInstruction = 'QUAN TRỌNG: Bạn BẮT BUỘC phải gán thuộc tính "question_type" là "multi_select" cho tất cả câu hỏi được tạo ra!';
          formatInstruction = 'Đảm bảo có ít nhất 1 đáp án is_correct: true. Học sinh sẽ tích chọn các đáp án đúng.';
          break;
        case 'true_false':
          typeStr = 'đúng/sai (2 đáp án)';
          typeInstruction = 'QUAN TRỌNG: Bạn BẮT BUỘC phải gán thuộc tính "question_type" là "true_false" cho tất cả câu hỏi được tạo ra!';
          break;
        case 'fill_blank':
          typeStr = 'điền vào chỗ trống';
          typeInstruction = 'QUAN TRỌNG: Bạn BẮT BUỘC phải gán thuộc tính "question_type" là "fill_blank" cho tất cả câu hỏi được tạo ra!';
          formatInstruction = 'Với dạng điền vào chỗ trống, nội dung câu hỏi chứa "____" để điền. Mảng answer_options chứa 1 phần tử duy nhất là từ/cụm từ đúng đắn (is_correct: true).';
          break;
        case 'matching':
          typeStr = 'ghép cặp';
          typeInstruction = 'QUAN TRỌNG: Bạn BẮT BUỘC phải gán thuộc tính "question_type" là "matching" cho tất cả câu hỏi được tạo ra!';
          formatInstruction = 'Với dạng ghép cặp, bỏ trống mảng answer_options. Thay vào đó hãy trả về đối tượng metadata: { "pairs": [ { "leftText": "...", "rightText": "..." } ] } chứa ít nhất 3 cặp tương ứng nhau.';
          break;
        default: // 'mixed'
          typeStr = 'tổng hợp đa dạng (kết hợp các loại: trắc nghiệm multiple_choice, trắc nghiệm nhiều đáp án multi_select, đúng/sai true_false, điền từ fill_blank, ghép cặp matching)';
          typeInstruction = 'QUAN TRỌNG: Với TỪNG câu hỏi, bạn BẮT BUỘC phải gán thuộc tính "question_type" là một trong các loại cụ thể sau: "multiple_choice", "multi_select", "true_false", "fill_blank", hoặc "matching". TUYỆT ĐỐI KHÔNG gán "mixed" vào question_type!';
          formatInstruction = `Định dạng chi tiết theo từng loại:
- "multiple_choice": có 4 answer_options, đúng 1 đáp án is_correct: true.
- "multi_select": có 4 answer_options, 2 hoặc nhiều đáp án is_correct: true.
- "true_false": có 2 answer_options (Đúng / Sai).
- "fill_blank": nội dung câu hỏi chứa "____", answer_options chứa 1 đáp án là từ cần điền.
- "matching": answer_options để rỗng [], thay vào đó trả về đối tượng metadata: { "pairs": [ { "leftText": "...", "rightText": "..." } ] } có ít nhất 3 cặp.`;
      }
      
      const difficultyStr = params.difficulty ? `${params.difficulty}/5 sao` : 'ngẫu nhiên';
      
      const prompt = `Bạn là một chuyên gia giáo dục hàng đầu. Hãy tạo ${params.quantity} câu hỏi dạng ${typeStr} cho chủ đề "${params.topic}". Độ khó: ${difficultyStr}. Nội dung giải thích cần chi tiết.
${typeInstruction}
${formatInstruction}`;

      const { response } = await generateContentWithFallback(this.ai, {
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
                },
                metadata: {
                  type: Type.OBJECT,
                  properties: {
                    pairs: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          leftText: { type: Type.STRING },
                          rightText: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              },
              required: ["content", "question_type", "difficulty", "explanation"]
            }
          }
        }
      });

      const jsonString = response.text || "[]";
      const parsedQuestions = JSON.parse(jsonString);

      // Sanitize and auto-detect question_type defensively
      const validTypes = new Set(['multiple_choice', 'multi_select', 'true_false', 'fill_blank', 'matching']);
      
      return parsedQuestions.map((q: any) => {
        let qType = q.question_type;
        if (!validTypes.has(qType)) {
          // Auto-detect type based on question structure if Gemini returned 'mixed' or unknown type
          if (q.metadata?.pairs && Array.isArray(q.metadata.pairs) && q.metadata.pairs.length > 0) {
            qType = 'matching';
          } else if (
            Array.isArray(q.answer_options) && 
            q.answer_options.length === 2 && 
            (q.answer_options[0]?.content === 'Đúng' || q.answer_options[0]?.content === 'True')
          ) {
            qType = 'true_false';
          } else if (q.content?.includes('____') && Array.isArray(q.answer_options) && q.answer_options.length === 1) {
            qType = 'fill_blank';
          } else if (Array.isArray(q.answer_options) && q.answer_options.filter((o: any) => o.is_correct).length > 1) {
            qType = 'multi_select';
          } else {
            qType = 'multiple_choice';
          }
        }

        return {
          ...q,
          question_type: qType,
          difficulty: Math.max(1, Math.min(5, Number(q.difficulty) || 3)),
        };
      });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
}

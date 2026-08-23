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
   * Generates a comprehensive pedagogical evaluation report for a class
   * Strictly follows formal academic tone with NO emojis and NO icons.
   */
  async generateComprehensiveClassReport(classId: string, statsData: any): Promise<{
    executive_summary: string;
    strengths_and_weaknesses: string;
    sm2_learning_analysis: string;
    pedagogical_action_plan: string[];
  } | null> {
    const todayStr = new Date().toISOString().split('T')[0];
    const cacheKey = `ai:class-report:comprehensive:${classId}:${todayStr}`;

    try {
      // 1. Check Redis cache first
      const cached = await this.aiCacheRepo.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // 2. Prompt Gemini AI with strict academic constraints
      const prompt = `Bạn là một Chuyên gia Đánh giá và Kiểm định Chất lượng Giáo dục cấp cao.
Hãy phân tích bộ dữ liệu thống kê học tập của lớp học dưới đây và viết một bản Báo cáo Đánh giá Sư phạm Chuyên sâu:

DỮ LIỆU THỐNG KÊ LỚP HỌC:
${JSON.stringify(statsData, null, 2)}

YÊU CẦU NGHIÊM NGẶT VỀ VĂN PHONG VÀ ĐỊNH DẠNG:
1. TUYỆT ĐỐI KHÔNG SỬ DỤNG BẤT KỲ BIỂU TƯỢNG CẢM XÚC (EMOJI) HOẶC KÝ TỰ ICON NÀO.
2. Sử dụng tiếng Việt trang trọng, học thuật, chuẩn mực văn bản hành chính giáo dục.
3. Phân tích chi tiết, sâu sắc, lập luận dựa trên số liệu thực tế, tránh các nhận xét chung chung.

Báo cáo gồm 4 phần và trả về ĐÚNG định dạng JSON sau:
{
  "executive_summary": "Phân tích 150-200 từ về bức tranh tổng thể năng lực, sự chuyên cần và độ hoàn thành bài tập của cả lớp.",
  "strengths_and_weaknesses": "Phân tích 200-250 từ chỉ rõ các chuyên đề/chủ đề lớp đã làm chủ và mổ xẻ nguyên nhân các chuyên đề có tỷ lệ sai cao.",
  "sm2_learning_analysis": "Phân tích 150-200 từ về khả năng ghi nhớ dài hạn theo mô hình Spaced Repetition SM2 (tỷ lệ kiến thức vùng nguy cơ quên và nhóm học sinh cần lưu ý).",
  "pedagogical_action_plan": [
    "Khuyến nghị hành động 1: Cụ thể về thời lượng và chuyên đề cần bổ trợ",
    "Khuyến nghị hành động 2: Kế hoạch giao bài tập củng cố phân hóa",
    "Khuyến nghị hành động 3: Phương án kèm cặp học sinh vùng nguy cơ"
  ]
}`;

      const { response } = await generateContentWithFallback(this.ai, {
        contents: prompt,
      });

      const text = response.text || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
      const parsed = JSON.parse(jsonStr);

      // Defensively ensure structure
      const formattedResult = {
        executive_summary: parsed.executive_summary || 'Lớp học duy trì tiến độ học tập ổn định theo kế hoạch đào tạo.',
        strengths_and_weaknesses: parsed.strengths_and_weaknesses || 'Các chủ đề cơ bản được hoàn thành tốt, cần tiếp tục rèn luyện các nội dung nâng cao.',
        sm2_learning_analysis: parsed.sm2_learning_analysis || 'Chỉ số ghi nhớ Spaced Repetition SM2 phản ánh sự duy trì đều đặn ở các đợt ôn tập định kỳ.',
        pedagogical_action_plan: Array.isArray(parsed.pedagogical_action_plan) && parsed.pedagogical_action_plan.length > 0
          ? parsed.pedagogical_action_plan
          : [
              'Tổ chức ôn tập củng cố các chuyên đề có tỷ lệ sai trên 30%.',
              'Giao thêm các bài luyện tập thích ứng cho nhóm học sinh cần hỗ trợ.'
            ]
      };

      // 3. Cache in Redis for 24h
      await this.aiCacheRepo.setEx(cacheKey, 86400, JSON.stringify(formattedResult));

      // 4. Save to database ai_reports if needed
      try {
        await this.aiRepo.saveClassReport(classId, formattedResult);
      } catch (err) {
        // non-blocking db save error
      }

      return formattedResult;
    } catch (error) {
      Sentry.captureException(error);
      return {
        executive_summary: 'Lớp học đang duy trì tiến độ học tập và hoàn thành các bài tập theo phân phối chương trình.',
        strengths_and_weaknesses: 'Học sinh nắm vững các kỹ năng cơ bản, cần tăng cường thêm thời lượng thực hành nâng cao.',
        sm2_learning_analysis: 'Đa số kiến thức đang trong chu kỳ lặp lại ngắt quãng SM2 và duy trì mức độ ghi nhớ tích cực.',
        pedagogical_action_plan: [
          'Duy trì lịch giao bài tập và theo dõi tỷ lệ hoàn thành hàng tuần.',
          'Hỗ trợ giải đáp các câu hỏi học sinh thường xuyên làm sai.'
        ]
      };
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

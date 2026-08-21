import { GoogleGenAI, Type } from '@google/genai';
import { asyncPool } from '../../utils/asyncPool';
import * as Sentry from '@sentry/node';
import { config } from '../../config';
import { generateContentWithFallback } from './gemini-fallback';
import { WizardLesson, WizardTopic, WizardQuestion } from './ai-wizard.schema';

export interface CurriculumOutlineResult {
  curriculum_title: string;
  description: string;
  lessons: WizardLesson[];
}

export interface UnitContentResult {
  topics: WizardTopic[];
  questions: WizardQuestion[];
}

export class AiWizardService {
  private ai: GoogleGenAI;

  constructor(aiClient?: GoogleGenAI) {
    this.ai = aiClient || new GoogleGenAI({ apiKey: config.ai.geminiApiKey });
  }

  /**
   * Step 1: Global Pass - Extract Curriculum Outline and Lesson Units from Document Text or File Buffer (Supports Multimodal Scanned PDFs)
   */
  async extractCurriculumOutline(
    input:
      | string
      | {
          text?: string;
          fileBuffer?: Buffer;
          mimeType?: string;
          filename?: string;
        }
  ): Promise<CurriculumOutlineResult> {
    let tempFilePath: string | null = null;
    let uploadedRemoteFileName: string | null = null;

    try {
      const basePrompt = `Bạn là chuyên gia sư phạm và thiết kế chương trình học.
Hãy phân tích tài liệu/giáo trình/sách giáo khoa sau (đặc biệt là phần Mục Lục và cấu trúc các chương/bài) và trích xuất cấu trúc Lộ trình bài học hoàn chỉnh theo từng Unit/Chương/Bài.
QUY TẮC BẮT BUỘC:
1. Đặt tên tiêu đề giáo trình tổng quan ngắn gọn, chuẩn xác.
2. Liệt kê lần lượt từng bài học (Unit / Lesson / Chương), kèm tóm tắt nội dung chính và khoảng trang ước tính (page_range).
3. Đảm bảo thứ tự logic theo order_index tăng dần bắt đầu từ 1.
4. Gán temp_id theo định dạng 'lesson_1', 'lesson_2',...`;

      let contents: any;

      if (typeof input === 'string' || (input.text && input.text.trim().length >= 50)) {
        const textContent = typeof input === 'string' ? input : input.text!;
        contents = `${basePrompt}

NỘI DUNG TÀI LIỆU:
${textContent.slice(0, 50000)}`;
      } else if (input.fileBuffer) {
        // Scanned PDF / Document fallback using Gemini Multimodal Files API
        const fs = await import('fs');
        const os = await import('os');
        const path = await import('path');

        tempFilePath = path.join(
          os.tmpdir(),
          `ai_upload_${Date.now()}_${input.filename || 'document.pdf'}`
        );
        await fs.promises.writeFile(tempFilePath, input.fileBuffer);

        const uploadRes = await (this.ai.files as any).upload({
          file: tempFilePath,
          mimeType: input.mimeType || 'application/pdf',
        });
        uploadedRemoteFileName = uploadRes.name || null;

        contents = [
          {
            fileData: {
              fileUri: uploadRes.uri,
              mimeType: uploadRes.mimeType || input.mimeType || 'application/pdf',
            },
          },
          basePrompt,
        ];
      } else {
        throw new Error('Tài liệu không có nội dung văn bản hoặc file hợp lệ');
      }

      const { response } = await generateContentWithFallback(this.ai, {
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              curriculum_title: { type: Type.STRING },
              description: { type: Type.STRING },
              lessons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    temp_id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    order_index: { type: Type.INTEGER },
                    page_range: { type: Type.STRING },
                  },
                  required: ['temp_id', 'title', 'order_index'],
                },
              },
            },
            required: ['curriculum_title', 'lessons'],
          },
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const lessons: WizardLesson[] = (parsed.lessons || []).map((l: any, idx: number) => ({
        temp_id: l.temp_id || `lesson_${idx + 1}`,
        title: l.title || `Bài ${idx + 1}`,
        summary: l.summary || '',
        order_index: l.order_index ?? idx + 1,
        page_range: l.page_range || '',
        status: 'pending' as const,
        topics_count: 0,
        questions_count: 0,
      }));

      return {
        curriculum_title: parsed.curriculum_title || 'Chương trình học tự động',
        description: parsed.description || 'Lộ trình được tạo tự động từ tài liệu',
        lessons,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    } finally {
      if (tempFilePath) {
        const fs = await import('fs');
        await fs.promises.unlink(tempFilePath).catch(() => {});
      }
    }
  }

  /**
   * Step 2: Deep Pass - Generate Topics and Questions for a specific Lesson Unit
   */
  async generateUnitTopicsAndQuestions(
    lesson: WizardLesson,
    unitText: string,
    previousLessonSummary?: string,
    retries = 3
  ): Promise<UnitContentResult> {
    try {
      const prompt = `Bạn là chuyên gia ra đề thi và phân loại kiến thức theo phương pháp sư phạm hiện đại.
Hãy tạo danh mục Chủ đề kiến thức (Topics) và Ngân hàng câu hỏi trắc nghiệm/bài tập (Questions) cho bài học sau:
- Tên bài học: ${lesson.title}
- Tóm tắt bài học: ${lesson.summary || 'Không có'}
${previousLessonSummary ? `- Kiến thức bài trước (để tích hợp ôn tập ngắt quãng): ${previousLessonSummary}` : ''}

QUY TẮC BẮT BUỘC:
1. Tạo 2-4 Chủ đề kiến thức (Topics) cụ thể của bài. Mỗi Topic có temp_id (ví dụ: 'top_${lesson.temp_id}_1').
2. Tạo 4-8 Câu hỏi bài tập đa dạng độ khó (difficulty: 1 đến 4), thuộc các dạng câu hỏi: 'multiple_choice', 'multi_select', 'true_false', 'fill_blank', 'matching'.
3. NEO DẪN CHỨNG (evidence_quote): BẮT BUỘC trích dẫn 1 câu văn/đoạn trích trong bài làm căn cứ cho đáp án đúng.
4. ĐÁP ÁN NHIỄU (Distractors): Các phương án sai phải mô phỏng các lỗi sai ngữ pháp/từ vựng kinh điển của học sinh.
5. Với câu hỏi 'matching', điền metadata dạng: { pairs: [{ leftText: "...", rightText: "..." }] } và để answer_options rỗng.
6. Gán topic_temp_id của câu hỏi khớp với temp_id của Topic tương ứng đã tạo.

NỘI DUNG CHI TIẾT CỦA BÀI HỌC NÀY:
${unitText.slice(0, 30000)}`;

      const { response } = await generateContentWithFallback(this.ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    temp_id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ['temp_id', 'name'],
                },
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    temp_id: { type: Type.STRING },
                    topic_temp_id: { type: Type.STRING },
                    content: { type: Type.STRING },
                    question_type: { type: Type.STRING },
                    difficulty: { type: Type.INTEGER },
                    evidence_quote: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    answer_options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          content: { type: Type.STRING },
                          is_correct: { type: Type.BOOLEAN },
                          order_index: { type: Type.INTEGER },
                        },
                        required: ['content', 'is_correct'],
                      },
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
                              rightText: { type: Type.STRING },
                            },
                            required: ['leftText', 'rightText'],
                          },
                        },
                      },
                    },
                  },
                  required: ['temp_id', 'topic_temp_id', 'content', 'question_type', 'difficulty', 'answer_options'],
                },
              },
            },
            required: ['topics', 'questions'],
          },
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const topics: WizardTopic[] = (parsed.topics || []).map((t: any, idx: number) => ({
        temp_id: t.temp_id || `top_${lesson.temp_id}_${idx + 1}`,
        name: t.name || `Chủ đề ${idx + 1}`,
        description: t.description || '',
      }));

      const questions: WizardQuestion[] = (parsed.questions || []).map((q: any, idx: number) => ({
        temp_id: q.temp_id || `q_${lesson.temp_id}_${idx + 1}`,
        topic_temp_id: q.topic_temp_id || (topics[0]?.temp_id ?? 'top_1'),
        content: q.content || 'Câu hỏi',
        question_type: q.question_type || 'multiple_choice',
        difficulty: q.difficulty ?? 2,
        evidence_quote: q.evidence_quote || '',
        explanation: q.explanation || '',
        answer_options: (q.answer_options || []).map((opt: any, optIdx: number) => ({
          content: opt.content || '',
          is_correct: !!opt.is_correct,
          order_index: opt.order_index ?? optIdx,
        })),
        metadata: q.metadata || {},
      }));

      return { topics, questions };
    } catch (error: any) {
      if (retries > 0) {
        const delayMs = (4 - retries) * 1500;
        await new Promise((r) => setTimeout(r, delayMs));
        return this.generateUnitTopicsAndQuestions(lesson, unitText, previousLessonSummary, retries - 1);
      }
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Concurrency Pool Execution: Generates content for multiple lessons concurrently with SSE Progress Callback
   */
  async generateBatchUnitsContent(
    lessons: WizardLesson[],
    textChunks: Record<string, string>,
    onProgress?: (event: {
      type: 'unit_started' | 'unit_completed' | 'all_completed' | 'unit_error';
      lesson_temp_id?: string;
      progress_pct: number;
      topics?: WizardTopic[];
      questions?: WizardQuestion[];
      error?: string;
    }) => void
  ): Promise<{
    lessons: WizardLesson[];
    topicsByLesson: Record<string, WizardTopic[]>;
    questionsByLesson: Record<string, WizardQuestion[]>;
  }> {
    const topicsByLesson: Record<string, WizardTopic[]> = {};
    const questionsByLesson: Record<string, WizardQuestion[]> = {};
    let completedCount = 0;
    const total = lessons.length;

    await asyncPool(2, lessons, async (lesson, index) => {
      const unitText = textChunks[lesson.temp_id] || lesson.summary || lesson.title;
      const prevSummary = index > 0 ? lessons[index - 1].summary : undefined;

      if (onProgress) {
        onProgress({
          type: 'unit_started',
          lesson_temp_id: lesson.temp_id,
          progress_pct: Math.round((completedCount / total) * 100),
        });
      }

      // Small throttling gap between requests
      await new Promise((r) => setTimeout(r, 200));

      try {
        const result = await this.generateUnitTopicsAndQuestions(lesson, unitText, prevSummary);
        topicsByLesson[lesson.temp_id] = result.topics;
        questionsByLesson[lesson.temp_id] = result.questions;
        lesson.status = 'ready';
        lesson.topics_count = result.topics.length;
        lesson.questions_count = result.questions.length;
        completedCount++;

        if (onProgress) {
          onProgress({
            type: 'unit_completed',
            lesson_temp_id: lesson.temp_id,
            progress_pct: Math.round((completedCount / total) * 100),
            topics: result.topics,
            questions: result.questions,
          });
        }
      } catch (err: any) {
        lesson.status = 'error';
        lesson.error_message = err?.message || 'Lỗi sinh nội dung';
        completedCount++;
        if (onProgress) {
          onProgress({
            type: 'unit_error',
            lesson_temp_id: lesson.temp_id,
            progress_pct: Math.round((completedCount / total) * 100),
            error: err?.message || 'Failed to generate unit content',
          });
        }
      }
    });

    if (onProgress) {
      onProgress({
        type: 'all_completed',
        progress_pct: 100,
      });
    }

    return { lessons, topicsByLesson, questionsByLesson };
  }


  /**
   * Regenerate a single question in Modal
   */
  async regenerateSingleQuestion(
    currentQuestion: WizardQuestion,
    unitText: string,
    instruction?: string
  ): Promise<WizardQuestion> {
    try {
      const prompt = `Bạn là chuyên gia giáo dục. Hãy sinh lại một câu hỏi mới thay thế cho câu hỏi hiện tại:
- Câu hỏi cũ: "${currentQuestion.content}"
- Dạng câu hỏi mong muốn: ${currentQuestion.question_type}
- Độ khó: ${currentQuestion.difficulty}/5
${instruction ? `- Yêu cầu chỉnh sửa thêm của giáo viên: "${instruction}"` : ''}

NỘI DUNG TÀI LIỆU THAM KHẢO:
${unitText.slice(0, 15000)}`;

      const { response } = await generateContentWithFallback(this.ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              question_type: { type: Type.STRING },
              difficulty: { type: Type.INTEGER },
              evidence_quote: { type: Type.STRING },
              explanation: { type: Type.STRING },
              answer_options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    content: { type: Type.STRING },
                    is_correct: { type: Type.BOOLEAN },
                    order_index: { type: Type.INTEGER },
                  },
                  required: ['content', 'is_correct'],
                },
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
                        rightText: { type: Type.STRING },
                      },
                      required: ['leftText', 'rightText'],
                    },
                  },
                },
              },
            },
            required: ['content', 'question_type', 'difficulty', 'answer_options'],
          },
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        temp_id: currentQuestion.temp_id,
        topic_temp_id: currentQuestion.topic_temp_id,
        content: parsed.content || currentQuestion.content,
        question_type: parsed.question_type || currentQuestion.question_type,
        difficulty: parsed.difficulty ?? currentQuestion.difficulty,
        evidence_quote: parsed.evidence_quote || currentQuestion.evidence_quote,
        explanation: parsed.explanation || currentQuestion.explanation,
        answer_options: (parsed.answer_options || []).map((opt: any, idx: number) => ({
          content: opt.content || '',
          is_correct: !!opt.is_correct,
          order_index: opt.order_index ?? idx,
        })),
        metadata: parsed.metadata || {},
      };
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
}

import Papa from 'papaparse';
import { ApiError } from '../../lib/ApiError';
import { QuestionsRepository } from './questions.repository';

export class QuestionsService {
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async getOrCreateDefaultTopic(teacherId: string) {
    let defaultTopic = await this.questionsRepository.findTopic({
      created_by: teacherId,
      name: 'Chưa phân loại'
    });

    if (!defaultTopic) {
      let code = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      do {
        code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      } while (await this.questionsRepository.findTopic({ code }));

      defaultTopic = await this.questionsRepository.createTopic({
        name: 'Chưa phân loại',
        code: code,
        description: 'Chủ đề mặc định chứa các câu hỏi chưa được phân loại',
        created_by: teacherId
      });
    }
    return defaultTopic.id;
  }

  async createQuestion(data: any, teacherId: string) {
    let topicId = data.topic_id;
    if (!topicId) {
      topicId = await this.getOrCreateDefaultTopic(teacherId);
    }

    return this.questionsRepository.createQuestion({
      content: data.content,
      question_type: data.question_type,
      difficulty: data.difficulty,
      explanation: data.explanation,
      topic_id: topicId,
      is_public: data.is_public ?? false,
      created_by: teacherId,
      answer_options: {
        create: data.answer_options?.map((opt: any) => ({
          content: opt.content,
          is_correct: opt.is_correct,
          order_index: opt.order_index
        })) || []
      }
    });
  }

  async getQuestions(teacherId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const { topic_id, difficulty, type, search } = query;

    const where: any = { created_by: teacherId, deleted_at: null };
    if (difficulty) where.difficulty = parseInt(difficulty);
    if (type) where.question_type = type;
    if (search) where.content = { contains: search, mode: 'insensitive' };
    if (topic_id !== undefined) {
      where.topic_id = topic_id === 'null' ? null : topic_id;
    }

    const questions = await this.questionsRepository.findQuestions(where, (page - 1) * limit, limit);
    const total = await this.questionsRepository.countQuestions(where);

    return { questions, meta: { page, limit, total } };
  }

  async getQuestionById(questionId: string, teacherId: string) {
    const question = await this.questionsRepository.findQuestionById(questionId);
    if (!question || question.created_by !== teacherId) {
      throw new ApiError(404, 'Question not found');
    }
    return question;
  }

  async updateQuestion(questionId: string, teacherId: string, data: any) {
    const question = await this.getQuestionById(questionId, teacherId);

    let topicId = data.topic_id !== undefined ? data.topic_id : question.topic_id;
    if (!topicId) {
      topicId = await this.getOrCreateDefaultTopic(teacherId);
    }

    // Update uses a transaction to replace answer options
    return this.questionsRepository.executeTransaction(async (tx) => {
      await this.questionsRepository.deleteAnswerOptions(questionId, tx);
      
      return this.questionsRepository.updateQuestion(questionId, {
        content: data.content,
        question_type: data.question_type,
        difficulty: data.difficulty,
        explanation: data.explanation,
        topic_id: topicId,
        is_public: data.is_public !== undefined ? data.is_public : question.is_public,
        updated_at: new Date(),
        answer_options: {
          create: data.answer_options?.map((opt: any) => ({
            content: opt.content,
            is_correct: opt.is_correct,
            order_index: opt.order_index
          })) || []
        }
      }, tx);
    });
  }

  async togglePublish(questionId: string, teacherId: string) {
    const question = await this.getQuestionById(questionId, teacherId);
    return this.questionsRepository.updateQuestion(questionId, {
      is_public: !question.is_public,
      updated_at: new Date()
    });
  }

  async deleteQuestion(questionId: string, teacherId: string) {
    await this.getQuestionById(questionId, teacherId);
    return this.questionsRepository.updateQuestion(questionId, { deleted_at: new Date() });
  }

  async importCSV(fileData: string, teacherId: string) {
    const parsed = Papa.parse(fileData, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
      return { importedCount: 0, errors: parsed.errors.map((e: any) => `Dòng ${e.row}: ${e.message}`) };
    }

    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const row: any = parsed.data[i];
      try {
        if (!row['Nội dung câu hỏi']) throw new ApiError(400, 'Thiếu Nội dung câu hỏi');
        
        let questionType = 'multiple_choice';
        if (row['Loại câu hỏi'] === 'true_false') questionType = 'true_false';
        
        let difficulty = parseInt(row['Độ khó']);
        if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) difficulty = 3;

        let topicId = null;
        const topicCodeInput = (row['Mã Chủ đề (Code)'] || row['ID Chủ đề'] || '').toString().trim().toUpperCase();
        
        if (topicCodeInput) {
          let topic = await this.questionsRepository.findTopic({ code: topicCodeInput });
          if (!topic) {
            topic = await this.questionsRepository.createTopic({
              name: topicCodeInput,
              code: topicCodeInput,
              created_by: teacherId
            });
          }
          topicId = topic.id;
        } else {
          topicId = await this.getOrCreateDefaultTopic(teacherId);
        }
        
        const answerOptions = [];
        const correctCol = (row['Đáp án Đúng'] || '').toString().trim().toUpperCase();

        if (questionType === 'multiple_choice') {
          let correctIndex = -1;
          if (correctCol === 'A' || correctCol === '1') correctIndex = 1;
          else if (correctCol === 'B' || correctCol === '2') correctIndex = 2;
          else if (correctCol === 'C' || correctCol === '3') correctIndex = 3;
          else if (correctCol === 'D' || correctCol === '4') correctIndex = 4;
          else throw new ApiError(400, `Với câu trắc nghiệm, cột "Đáp án Đúng" phải là A, B, C hoặc D. Giá trị hiện tại: ${correctCol}`);

          for (let j = 1; j <= 4; j++) {
            const content = row[`Đáp án ${j}`];
            if (content) {
              answerOptions.push({
                content: content.toString().trim(),
                is_correct: j === correctIndex,
                order_index: j - 1
              });
            } else if (j === correctIndex) {
               throw new ApiError(400, `Bạn chọn đáp án đúng là ${correctCol} nhưng cột Đáp án ${j} lại bị trống.`);
            }
          }
          if (answerOptions.length < 2) throw new ApiError(400, 'Câu hỏi trắc nghiệm cần ít nhất 2 đáp án');
        } else if (questionType === 'true_false') {
          const isTrue = correctCol === 'TRUE' || correctCol === 'ĐÚNG' || correctCol === '1';
          answerOptions.push({ content: 'Đúng', is_correct: isTrue, order_index: 0 });
          answerOptions.push({ content: 'Sai', is_correct: !isTrue, order_index: 1 });
        }

        await this.questionsRepository.createQuestion({
          content: row['Nội dung câu hỏi'].toString().trim(),
          question_type: questionType as any,
          difficulty: difficulty,
          explanation: row['Giải thích'] ? row['Giải thích'].toString().trim() : null,
          topic_id: topicId,
          created_by: teacherId,
          answer_options: {
            create: answerOptions
          }
        });
        
        importedCount++;
      } catch (err: any) {
        errors.push(`Dòng ${i + 2}: ${err.message}`);
      }
    }

    return { importedCount, errors };
  }

  // Topic Methods

  async createTopic(data: any, teacherId: string) {
    let code = data.code;
    if (!code) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      do {
        code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      } while (await this.questionsRepository.findTopic({ code }));
    } else {
      code = code.toUpperCase();
      const existing = await this.questionsRepository.findTopic({ code });
      if (existing) throw new ApiError(400, 'Mã topic này đã tồn tại!');
    }

    return this.questionsRepository.createTopic({
      name: data.name,
      code: code,
      description: data.description,
      created_by: teacherId
    });
  }

  async getTopics(teacherId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const { search } = query;

    const where: any = { 
      created_by: teacherId, 
      deleted_at: null,
      NOT: {
        AND: [
          { name: 'Chưa phân loại' },
          { questions: { none: { deleted_at: null } } }
        ]
      }
    };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    
    const topics = await this.questionsRepository.findTopics(where, (page - 1) * limit, limit);
    const total = await this.questionsRepository.countTopics(where);

    return { topics, meta: { page, limit, total } };
  }

  async getTopicById(topicId: string, teacherId: string) {
    const topic = await this.questionsRepository.findTopicById(topicId);
    if (!topic || topic.created_by !== teacherId) {
      throw new ApiError(404, 'Topic not found');
    }
    return topic;
  }

  async updateTopic(topicId: string, teacherId: string, data: any) {
    await this.getTopicById(topicId, teacherId);

    return this.questionsRepository.updateTopic(topicId, {
      name: data.name,
      description: data.description,
      updated_at: new Date()
    });
  }

  async deleteTopic(topicId: string, teacherId: string) {
    await this.getTopicById(topicId, teacherId);
    
    await this.questionsRepository.deleteTopicWithQuestions(topicId, teacherId);

    return { success: true };
  }
}

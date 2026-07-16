import { prisma } from '../../lib/prisma';
import Papa from 'papaparse';

export class QuestionsService {
  static async getOrCreateDefaultTopic(teacherId: string) {
    let defaultTopic = await prisma.topic.findFirst({
      where: {
        created_by: teacherId,
        name: 'Chưa phân loại'
      }
    });

    if (!defaultTopic) {
      let code = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      do {
        code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      } while (await prisma.topic.findFirst({ where: { code } }));

      defaultTopic = await prisma.topic.create({
        data: {
          name: 'Chưa phân loại',
          code: code,
          description: 'Chủ đề mặc định chứa các câu hỏi chưa được phân loại',
          created_by: teacherId
        }
      });
    }
    return defaultTopic.id;
  }

  static async createQuestion(data: any, teacherId: string) {
    let topicId = data.topic_id;
    if (!topicId) {
      topicId = await this.getOrCreateDefaultTopic(teacherId);
    }

    return prisma.question.create({
      data: {
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
      },
      include: { answer_options: true }
    });
  }

  static async getQuestions(teacherId: string, query: any) {
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
    if (search) where.content = { contains: search, mode: 'insensitive' };

    const questions = await prisma.question.findMany({
      where,
      include: { answer_options: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' }
    });

    const total = await prisma.question.count({ where });

    return { questions, meta: { page, limit, total } };
  }

  static async getQuestionById(questionId: string, teacherId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId, deleted_at: null },
      include: { answer_options: true }
    });
    if (!question || question.created_by !== teacherId) {
      throw { status: 404, message: 'Question not found' };
    }
    return question;
  }

  static async updateQuestion(questionId: string, teacherId: string, data: any) {
    const question = await this.getQuestionById(questionId, teacherId);

    let topicId = data.topic_id !== undefined ? data.topic_id : question.topic_id;
    if (!topicId) {
      topicId = await this.getOrCreateDefaultTopic(teacherId);
    }

    // Update uses a transaction to replace answer options
    return prisma.$transaction(async (tx) => {
      await tx.answerOption.deleteMany({ where: { question_id: questionId } });
      
      return tx.question.update({
        where: { id: questionId },
        data: {
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
        },
        include: { answer_options: true }
      });
    });
  }

  static async togglePublish(questionId: string, teacherId: string) {
    const question = await this.getQuestionById(questionId, teacherId);
    return prisma.question.update({
      where: { id: questionId },
      data: {
        is_public: !question.is_public,
        updated_at: new Date()
      },
      include: { answer_options: true }
    });
  }

  static async deleteQuestion(questionId: string, teacherId: string) {
    await this.getQuestionById(questionId, teacherId);
    return prisma.question.update({
      where: { id: questionId },
      data: { deleted_at: new Date() }
    });
  }

  static async importCSV(fileData: string, teacherId: string) {
    const parsed = Papa.parse(fileData, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
      return { importedCount: 0, errors: parsed.errors.map(e => `Dòng ${e.row}: ${e.message}`) };
    }

    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const row: any = parsed.data[i];
      try {
        if (!row['Nội dung câu hỏi']) throw new Error('Thiếu Nội dung câu hỏi');
        
        let questionType = 'multiple_choice';
        if (row['Loại câu hỏi'] === 'true_false') questionType = 'true_false';
        
        let difficulty = parseInt(row['Độ khó']);
        if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) difficulty = 3;

        let topicId = null;
        const topicCodeInput = (row['Mã Chủ đề (Code)'] || row['ID Chủ đề'] || '').toString().trim().toUpperCase();
        
        if (topicCodeInput) {
          let topic = await prisma.topic.findFirst({ where: { code: topicCodeInput } });
          if (!topic) {
            topic = await prisma.topic.create({
              data: {
                name: topicCodeInput,
                code: topicCodeInput,
                created_by: teacherId
              }
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
          else throw new Error(`Với câu trắc nghiệm, cột "Đáp án Đúng" phải là A, B, C hoặc D. Giá trị hiện tại: ${correctCol}`);

          for (let j = 1; j <= 4; j++) {
            const content = row[`Đáp án ${j}`];
            if (content) {
              answerOptions.push({
                content: content.toString().trim(),
                is_correct: j === correctIndex,
                order_index: j - 1
              });
            } else if (j === correctIndex) {
               throw new Error(`Bạn chọn đáp án đúng là ${correctCol} nhưng cột Đáp án ${j} lại bị trống.`);
            }
          }
          if (answerOptions.length < 2) throw new Error('Câu hỏi trắc nghiệm cần ít nhất 2 đáp án');
        } else if (questionType === 'true_false') {
          const isTrue = correctCol === 'TRUE' || correctCol === 'ĐÚNG' || correctCol === '1';
          answerOptions.push({ content: 'Đúng', is_correct: isTrue, order_index: 0 });
          answerOptions.push({ content: 'Sai', is_correct: !isTrue, order_index: 1 });
        }

        await prisma.question.create({
          data: {
            content: row['Nội dung câu hỏi'].toString().trim(),
            question_type: questionType as any,
            difficulty: difficulty,
            explanation: row['Giải thích'] ? row['Giải thích'].toString().trim() : null,
            topic_id: topicId,
            created_by: teacherId,
            answer_options: {
              create: answerOptions
            }
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

  static async createTopic(data: any, teacherId: string) {
    let code = data.code;
    if (!code) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      do {
        code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      } while (await prisma.topic.findFirst({ where: { code } }));
    } else {
      code = code.toUpperCase();
      const existing = await prisma.topic.findFirst({ where: { code } });
      if (existing) throw new Error('Mã topic này đã tồn tại!');
    }

    return prisma.topic.create({
      data: {
        name: data.name,
        code: code,
        description: data.description,
        created_by: teacherId
      }
    });
  }

  static async getTopics(teacherId: string, query: any) {
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
    
    const topics = await prisma.topic.findMany({
      where,
      include: {
        _count: {
          select: { questions: { where: { deleted_at: null } } }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' }
    });

    const total = await prisma.topic.count({ where });

    return { topics, meta: { page, limit, total } };
  }

  static async getTopicById(topicId: string, teacherId: string) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId, deleted_at: null },
      include: {
        questions: {
          where: { deleted_at: null },
          include: { answer_options: true }
        }
      }
    });
    if (!topic || topic.created_by !== teacherId) {
      throw { status: 404, message: 'Topic not found' };
    }
    return topic;
  }

  static async updateTopic(topicId: string, teacherId: string, data: any) {
    await this.getTopicById(topicId, teacherId);

    return prisma.topic.update({
      where: { id: topicId },
      data: {
        name: data.name,
        description: data.description,
        updated_at: new Date()
      }
    });
  }

  static async deleteTopic(topicId: string, teacherId: string) {
    await this.getTopicById(topicId, teacherId);
    
    const deleteTopicPromise = prisma.topic.update({
      where: { id: topicId },
      data: { deleted_at: new Date() }
    });

    const deleteQuestionsPromise = prisma.question.updateMany({
      where: { topic_id: topicId, created_by: teacherId, deleted_at: null },
      data: { deleted_at: new Date() }
    });

    await prisma.$transaction([deleteTopicPromise, deleteQuestionsPromise]);

    return { success: true };
  }
}

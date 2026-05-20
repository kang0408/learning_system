import { prisma } from '../../lib/prisma';

export class QuestionsService {
  static async createQuestion(data: any, teacherId: string) {
    return prisma.question.create({
      data: {
        content: data.content,
        question_type: data.question_type,
        difficulty: data.difficulty,
        explanation: data.explanation,
        topic_id: data.topic_id || null,
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
          topic_id: data.topic_id !== undefined ? data.topic_id : question.topic_id,
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
    return { importedCount: 0, errors: [] };
  }

  // Topic Methods

  static async createTopic(data: any, teacherId: string) {
    return prisma.topic.create({
      data: {
        name: data.name,
        description: data.description,
        created_by: teacherId
      }
    });
  }

  static async getTopics(teacherId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;

    const where = { created_by: teacherId, deleted_at: null };
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
    return prisma.topic.update({
      where: { id: topicId },
      data: { deleted_at: new Date() }
    });
  }
}

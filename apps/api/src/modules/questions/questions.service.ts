import { prisma } from '../../lib/prisma';

export class QuestionsService {
  static async createQuestion(data: any, teacherId: string) {
    return prisma.question.create({
      data: {
        content: data.content,
        question_type: data.question_type,
        topic: data.topic,
        difficulty: data.difficulty,
        explanation: data.explanation,
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
    const { topic, difficulty, type, search } = query;

    const where: any = { created_by: teacherId, deleted_at: null };
    if (topic) where.topic = topic;
    if (difficulty) where.difficulty = parseInt(difficulty);
    if (type) where.question_type = type;
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
          topic: data.topic,
          difficulty: data.difficulty,
          explanation: data.explanation,
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

  static async deleteQuestion(questionId: string, teacherId: string) {
    await this.getQuestionById(questionId, teacherId);
    return prisma.question.update({
      where: { id: questionId },
      data: { deleted_at: new Date() }
    });
  }

  static async getTopics(teacherId: string) {
    const topics = await prisma.question.groupBy({
      by: ['topic'],
      where: { created_by: teacherId, deleted_at: null, topic: { not: null } },
      _count: true
    });
    return topics.map(t => ({ name: t.topic, count: t._count }));
  }

  static async importCSV(fileData: string, teacherId: string) {
    // A full CSV parser is complex, we'll mock the import logic for now
    // as it usually requires 'csv-parse' or similar libraries.
    // In a real implementation we would parse, validate, and bulk insert.
    return { importedCount: 0, errors: [] };
  }
}

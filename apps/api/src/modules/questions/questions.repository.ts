import { PrismaClient, Prisma } from '@prisma/client';

export class QuestionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findTopic(where: Prisma.TopicWhereInput) {
    return this.prisma.topic.findFirst({ where });
  }

  async createTopic(data: Prisma.TopicUncheckedCreateInput) {
    return this.prisma.topic.create({ data });
  }

  async createQuestion(data: Prisma.QuestionUncheckedCreateInput) {
    return this.prisma.question.create({
      data,
      include: { answer_options: true }
    });
  }

  async findQuestions(where: Prisma.QuestionWhereInput, skip: number, take: number) {
    return this.prisma.question.findMany({
      where,
      include: { answer_options: true },
      skip,
      take,
      orderBy: { created_at: 'desc' }
    });
  }

  async countQuestions(where: Prisma.QuestionWhereInput) {
    return this.prisma.question.count({ where });
  }

  async findQuestionById(id: string) {
    return this.prisma.question.findUnique({
      where: { id, deleted_at: null },
      include: { answer_options: true }
    });
  }

  async executeTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async deleteAnswerOptions(questionId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.answerOption.deleteMany({ where: { question_id: questionId } });
  }

  async updateQuestion(id: string, data: Prisma.QuestionUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.question.update({
      where: { id },
      data,
      include: { answer_options: true }
    });
  }

  async findTopics(where: Prisma.TopicWhereInput, skip: number, take: number) {
    return this.prisma.topic.findMany({
      where,
      include: {
        _count: {
          select: { questions: { where: { deleted_at: null } } }
        }
      },
      skip,
      take,
      orderBy: { created_at: 'desc' }
    });
  }

  async countTopics(where: Prisma.TopicWhereInput) {
    return this.prisma.topic.count({ where });
  }

  async findTopicById(id: string) {
    return this.prisma.topic.findUnique({
      where: { id, deleted_at: null },
      include: {
        questions: {
          where: { deleted_at: null },
          include: { answer_options: true }
        }
      }
    });
  }

  async updateTopic(id: string, data: Prisma.TopicUncheckedUpdateInput) {
    return this.prisma.topic.update({
      where: { id },
      data
    });
  }

  async deleteTopicWithQuestions(topicId: string, teacherId: string) {
    return this.prisma.$transaction([
      this.prisma.topic.update({
        where: { id: topicId },
        data: { deleted_at: new Date() }
      }),
      this.prisma.question.updateMany({
        where: { topic_id: topicId, created_by: teacherId, deleted_at: null },
        data: { deleted_at: new Date() }
      })
    ]);
  }
}

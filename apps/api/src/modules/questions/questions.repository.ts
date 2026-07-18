import { PrismaClient, Prisma } from '@prisma/client';

export class QuestionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findTopic(where: Prisma.TopicWhereInput) {
    return this.prisma.topic.findFirst({ where });
  }

  async createTopic(data: Prisma.TopicUncheckedCreateInput) {
    return this.prisma.topic.create({ data });
  }

  async findAllTopics(teacherId: string) {
    return this.prisma.topic.findMany({
      where: { created_by: teacherId, deleted_at: null },
      select: { id: true, parent_id: true }
    });
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

  async bulkCreateQuestions(questions: Prisma.QuestionUncheckedCreateInput[], tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    
    // Prisma does not support bulk create with nested relations easily in a single query (createMany doesn't support nested creates)
    // So we iterate and create each within the transaction.
    const createdQuestions = [];
    for (const q of questions) {
      const created = await client.question.create({
        data: q,
        include: { answer_options: true }
      });
      createdQuestions.push(created);
    }
    
    return createdQuestions;
  }
}

import { PrismaClient, Prisma } from '@prisma/client';

export class TopicsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findTopic(where: Prisma.TopicWhereInput) {
    return this.prisma.topic.findFirst({ where });
  }

  async createTopic(data: Prisma.TopicUncheckedCreateInput) {
    return this.prisma.topic.create({ data });
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

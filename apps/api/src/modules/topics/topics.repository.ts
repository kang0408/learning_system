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

  async findAllTopicsForTree(where: Prisma.TopicWhereInput) {
    return this.prisma.topic.findMany({
      where,
      include: {
        _count: {
          select: { questions: { where: { deleted_at: null } } }
        }
      },
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

  async getAllDescendantTopicIds(topicIds: string[], teacherId: string): Promise<string[]> {
    const allIds = new Set<string>(topicIds);
    let currentParentIds = [...topicIds];

    while (currentParentIds.length > 0) {
      const children = await this.prisma.topic.findMany({
        where: {
          parent_id: { in: currentParentIds },
          created_by: teacherId,
          deleted_at: null,
        },
        select: { id: true },
      });

      if (children.length === 0) break;
      const newChildIds = children.map((c) => c.id).filter((id) => !allIds.has(id));
      if (newChildIds.length === 0) break;
      newChildIds.forEach((id) => allIds.add(id));
      currentParentIds = newChildIds;
    }

    return Array.from(allIds);
  }

  async deleteTopicWithQuestions(topicId: string, teacherId: string) {
    return this.deleteTopicsWithQuestionsBatch([topicId], teacherId);
  }

  async deleteTopicsWithQuestionsBatch(topicIds: string[], teacherId: string) {
    const allTargetIds = await this.getAllDescendantTopicIds(topicIds, teacherId);
    if (allTargetIds.length === 0) return { count: 0 };

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.topic.updateMany({
        where: { id: { in: allTargetIds }, created_by: teacherId, deleted_at: null },
        data: { deleted_at: now }
      }),
      this.prisma.question.updateMany({
        where: { topic_id: { in: allTargetIds }, created_by: teacherId, deleted_at: null },
        data: { deleted_at: now }
      })
    ]);

    return { count: allTargetIds.length };
  }
}

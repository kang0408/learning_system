import { ApiError } from '../../lib/ApiError';
import { TopicsRepository } from './topics.repository';

export class TopicsService {
  constructor(private readonly topicsRepository: TopicsRepository) {}

  async createTopic(data: any, teacherId: string) {
    let code = data.code;
    if (!code) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      do {
        code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      } while (await this.topicsRepository.findTopic({ code }));
    } else {
      code = code.toUpperCase();
      const existing = await this.topicsRepository.findTopic({ code });
      if (existing) throw new ApiError(400, 'Mã topic này đã tồn tại!');
    }

    return this.topicsRepository.createTopic({
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
    
    const topics = await this.topicsRepository.findTopics(where, (page - 1) * limit, limit);
    const total = await this.topicsRepository.countTopics(where);

    return { topics, meta: { page, limit, total } };
  }

  async getTopicById(topicId: string, teacherId: string) {
    const topic = await this.topicsRepository.findTopicById(topicId);
    if (!topic || topic.created_by !== teacherId) {
      throw new ApiError(404, 'Topic not found');
    }
    return topic;
  }

  async updateTopic(topicId: string, teacherId: string, data: any) {
    await this.getTopicById(topicId, teacherId);

    return this.topicsRepository.updateTopic(topicId, {
      name: data.name,
      description: data.description,
      updated_at: new Date()
    });
  }

  async deleteTopic(topicId: string, teacherId: string) {
    await this.getTopicById(topicId, teacherId);
    
    await this.topicsRepository.deleteTopicWithQuestions(topicId, teacherId);

    return { success: true };
  }
}

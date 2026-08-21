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

    if (data.parent_id) {
      const parent = await this.topicsRepository.findTopicById(data.parent_id);
      if (!parent || parent.created_by !== teacherId) {
        throw new ApiError(400, 'Topic cha không hợp lệ');
      }
    }

    return this.topicsRepository.createTopic({
      name: data.name,
      code: code,
      description: data.description,
      parent_id: data.parent_id,
      created_by: teacherId
    });
  }

  async getTopics(teacherId: string, query: any) {
    const { search, has_questions } = query;

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

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (has_questions === 'true') {
      where.questions = { some: { deleted_at: null } };
    } else if (has_questions === 'false') {
      where.questions = { none: { deleted_at: null } };
    }
    
    const allTopics = await this.topicsRepository.findAllTopicsForTree(where);
    
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const t of allTopics) {
      map.set(t.id, { ...t, children: [] });
    }

    for (const t of allTopics) {
      if (t.parent_id) {
        const parent = map.get(t.parent_id);
        if (parent) {
          parent.children.push(map.get(t.id));
        } else {
          roots.push(map.get(t.id));
        }
      } else {
        roots.push(map.get(t.id));
      }
    }

    return { topics: roots, meta: { page: 1, limit: roots.length, total: roots.length } };
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

    if (data.parent_id) {
      if (data.parent_id === topicId) {
        throw new ApiError(400, 'Topic không thể tự làm cha của chính nó');
      }
      const parent = await this.topicsRepository.findTopicById(data.parent_id);
      if (!parent || parent.created_by !== teacherId) {
        throw new ApiError(400, 'Topic cha không hợp lệ');
      }
    }

    return this.topicsRepository.updateTopic(topicId, {
      name: data.name,
      description: data.description,
      parent_id: data.parent_id,
      updated_at: new Date()
    });
  }

  async deleteTopic(topicId: string, teacherId: string) {
    await this.getTopicById(topicId, teacherId);
    
    const result = await this.topicsRepository.deleteTopicWithQuestions(topicId, teacherId);

    return { success: true, count: result.count };
  }

  async deleteTopicsBatch(topicIds: string[], teacherId: string) {
    if (!topicIds || topicIds.length === 0) {
      throw new ApiError(400, 'Danh sách topic cần xóa không được rỗng');
    }

    const result = await this.topicsRepository.deleteTopicsWithQuestionsBatch(topicIds, teacherId);

    return { success: true, count: result.count };
  }
}

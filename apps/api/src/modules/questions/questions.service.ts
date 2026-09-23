import { randomUUID } from 'crypto';
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
      metadata: data.metadata ? {
        pairs: data.metadata.pairs?.map((p: any) => ({
          leftId: p.leftId || randomUUID(),
          leftText: p.leftText,
          rightId: p.rightId || randomUUID(),
          rightText: p.rightText
        })) || []
      } : undefined,
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
    const { topic_id, difficulty, type, search, class_id } = query;

    const where: any = { created_by: teacherId, deleted_at: null };
    if (difficulty) where.difficulty = parseInt(difficulty);
    if (type) where.question_type = type;
    if (search) where.content = { contains: search, mode: 'insensitive' };
    if (class_id && class_id !== 'all') {
      where.assignment_questions = {
        some: {
          assignment: {
            class_id: class_id,
            deleted_at: null
          }
        }
      };
    }
    if (topic_id !== undefined) {
      if (topic_id === 'null') {
        where.topic_id = null;
      } else {
        const allTopics = await this.questionsRepository.findAllTopics(teacherId);
        const descendants = new Set<string>();
        descendants.add(topic_id);

        let added = true;
        while (added) {
          added = false;
          for (const t of allTopics) {
            if (t.parent_id && descendants.has(t.parent_id) && !descendants.has(t.id)) {
              descendants.add(t.id);
              added = true;
            }
          }
        }
        where.topic_id = { in: Array.from(descendants) };
      }
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
        metadata: data.metadata ? {
          pairs: data.metadata.pairs?.map((p: any) => ({
            leftId: p.leftId || randomUUID(),
            leftText: p.leftText,
            rightId: p.rightId || randomUUID(),
            rightText: p.rightText
          })) || []
        } : undefined,
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
    return this.questionsRepository.deleteQuestion(questionId);
  }

  async bulkCreateQuestions(data: { topic_id: string, questions: any[] }, teacherId: string) {
    let topicId = data.topic_id;
    if (!topicId) {
      topicId = await this.getOrCreateDefaultTopic(teacherId);
    }

    return this.questionsRepository.executeTransaction(async (tx) => {
      const formattedQuestions = data.questions.map((q: any) => ({
        content: q.content,
        question_type: q.question_type,
        difficulty: q.difficulty,
        explanation: q.explanation,
        topic_id: topicId,
        is_public: false,
        created_by: teacherId,
        metadata: q.metadata ? {
          pairs: q.metadata.pairs?.map((p: any) => ({
            leftId: p.leftId || randomUUID(),
            leftText: p.leftText,
            rightId: p.rightId || randomUUID(),
            rightText: p.rightText
          })) || []
        } : undefined,
        answer_options: {
          create: q.answer_options?.map((opt: any, index: number) => ({
            content: opt.content,
            is_correct: opt.is_correct,
            order_index: index
          })) || []
        }
      }));

      return this.questionsRepository.bulkCreateQuestions(formattedQuestions, tx);
    });
  }

  // Topic Methods moved to topics.service.ts
}

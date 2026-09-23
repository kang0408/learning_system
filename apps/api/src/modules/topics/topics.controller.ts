import { Request, Response } from 'express';
import { TopicsService } from './topics.service';
import { BaseController } from '../../controllers/BaseController';
import { createTopicSchema, updateTopicSchema } from './topics.schema';
import { AiService } from '../ai/ai.service';
import { parseDocumentBuffer } from '../../utils/documentParser';

export class TopicsController extends BaseController {
  constructor(
    private readonly topicsService: TopicsService,
    private readonly aiService?: AiService
  ) {
    super();
    this.createTopic = this.createTopic.bind(this);
    this.getTopics = this.getTopics.bind(this);
    this.getTopicById = this.getTopicById.bind(this);
    this.updateTopic = this.updateTopic.bind(this);
    this.deleteTopic = this.deleteTopic.bind(this);
    this.batchDeleteTopics = this.batchDeleteTopics.bind(this);
    this.generateFromDocument = this.generateFromDocument.bind(this);
  }

  async createTopic(req: any, res: Response) {
    const parseResult = createTopicSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const qs = await this.topicsService.createTopic(parseResult.data, req.user.userId);
    this.handleSuccess(res, qs, 201);
  }

  async getTopics(req: any, res: Response) {
    const result = await this.topicsService.getTopics(req.user.userId, req.query);
    this.handleSuccess(res, result.topics, 200, result.meta);
  }

  async getTopicById(req: any, res: Response) {
    const qs = await this.topicsService.getTopicById(req.params.id, req.user.userId);
    this.handleSuccess(res, qs);
  }

  async updateTopic(req: any, res: Response) {
    const parseResult = updateTopicSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const qs = await this.topicsService.updateTopic(req.params.id, req.user.userId, parseResult.data);
    this.handleSuccess(res, qs);
  }

  async deleteTopic(req: any, res: Response) {
    const result = await this.topicsService.deleteTopic(req.params.id, req.user.userId);
    this.handleSuccess(res, result);
  }

  async batchDeleteTopics(req: any, res: Response) {
    const { topicIds } = req.body;
    if (!Array.isArray(topicIds) || topicIds.length === 0) {
      return res.status(400).json({ success: false, error: 'topicIds phải là mảng không rỗng' });
    }
    const result = await this.topicsService.deleteTopicsBatch(topicIds, req.user.userId);
    this.handleSuccess(res, result);
  }

  async generateFromDocument(req: any, res: Response) {
    if (!this.aiService) {
      return res.status(500).json({ success: false, message: 'AI Service chưa được khởi tạo' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng tải lên 1 tệp tài liệu' });
    }

    const parsedDoc = await parseDocumentBuffer(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    if (!parsedDoc.text || parsedDoc.text.trim().length < 20) {
      return res.status(400).json({ success: false, message: 'Tệp tài liệu không chứa đủ nội dung văn bản để phân tích' });
    }

    const quantity = req.body.quantity ? Number(req.body.quantity) : 10;
    const difficulty = req.body.difficulty && req.body.difficulty !== 'random' ? Number(req.body.difficulty) : undefined;
    const question_type = req.body.question_type || 'mixed';

    const result = await this.aiService.generateTopicAndQuestionsFromDocument({
      documentText: parsedDoc.text,
      question_type,
      quantity,
      difficulty,
    });

    this.handleSuccess(res, result);
  }
}

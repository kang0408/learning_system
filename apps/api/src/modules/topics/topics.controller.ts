import { Request, Response } from 'express';
import { TopicsService } from './topics.service';
import { BaseController } from '../../controllers/BaseController';
import { createTopicSchema, updateTopicSchema } from './topics.schema';

export class TopicsController extends BaseController {
  constructor(private readonly topicsService: TopicsService) {
    super();
    this.createTopic = this.createTopic.bind(this);
    this.getTopics = this.getTopics.bind(this);
    this.getTopicById = this.getTopicById.bind(this);
    this.updateTopic = this.updateTopic.bind(this);
    this.deleteTopic = this.deleteTopic.bind(this);
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
    await this.topicsService.deleteTopic(req.params.id, req.user.userId);
    this.handleSuccess(res, null);
  }
}

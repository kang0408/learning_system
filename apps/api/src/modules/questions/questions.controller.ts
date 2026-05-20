import { Request, Response } from 'express';
import { QuestionsService } from './questions.service';
import { createQuestionSchema, updateQuestionSchema } from './questions.schema';

export class QuestionsController {
  static async createQuestion(req: any, res: Response) {
    const parseResult = createQuestionSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const q = await QuestionsService.createQuestion(parseResult.data, req.user.userId);
    res.status(201).json({ success: true, data: q });
  }

  static async getQuestions(req: any, res: Response) {
    const result = await QuestionsService.getQuestions(req.user.userId, req.query);
    res.json({ success: true, data: result.questions, meta: result.meta });
  }

  static async getQuestionById(req: any, res: Response) {
    const q = await QuestionsService.getQuestionById(req.params.id, req.user.userId);
    res.json({ success: true, data: q });
  }

  static async updateQuestion(req: any, res: Response) {
    const parseResult = updateQuestionSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const q = await QuestionsService.updateQuestion(req.params.id, req.user.userId, parseResult.data);
    res.json({ success: true, data: q });
  }

  static async togglePublish(req: any, res: Response) {
    const q = await QuestionsService.togglePublish(req.params.id, req.user.userId);
    res.json({ success: true, data: q });
  }

  static async deleteQuestion(req: any, res: Response) {
    await QuestionsService.deleteQuestion(req.params.id, req.user.userId);
    res.json({ success: true, data: null });
  }

  static async importCSV(req: any, res: Response) {
    // Assuming multer is configured in routes for file upload
    const result = await QuestionsService.importCSV("mock_data", req.user.userId);
    res.json({ success: true, data: result });
  }

  // Topic methods
  static async createTopic(req: any, res: Response) {
    const { createTopicSchema } = await import('./questions.schema');
    const parseResult = createTopicSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const qs = await QuestionsService.createTopic(parseResult.data, req.user.userId);
    res.status(201).json({ success: true, data: qs });
  }

  static async getTopics(req: any, res: Response) {
    const result = await QuestionsService.getTopics(req.user.userId, req.query);
    res.json({ success: true, data: result.topics, meta: result.meta });
  }

  static async getTopicById(req: any, res: Response) {
    const qs = await QuestionsService.getTopicById(req.params.id, req.user.userId);
    res.json({ success: true, data: qs });
  }

  static async updateTopic(req: any, res: Response) {
    const { updateTopicSchema } = await import('./questions.schema');
    const parseResult = updateTopicSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const qs = await QuestionsService.updateTopic(req.params.id, req.user.userId, parseResult.data);
    res.json({ success: true, data: qs });
  }

  static async deleteTopic(req: any, res: Response) {
    await QuestionsService.deleteTopic(req.params.id, req.user.userId);
    res.json({ success: true, data: null });
  }
}

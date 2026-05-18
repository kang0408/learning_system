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

  static async deleteQuestion(req: any, res: Response) {
    await QuestionsService.deleteQuestion(req.params.id, req.user.userId);
    res.json({ success: true, data: null });
  }

  static async getTopics(req: any, res: Response) {
    const topics = await QuestionsService.getTopics(req.user.userId);
    res.json({ success: true, data: topics });
  }

  static async importCSV(req: any, res: Response) {
    // Assuming multer is configured in routes for file upload
    const result = await QuestionsService.importCSV("mock_data", req.user.userId);
    res.json({ success: true, data: result });
  }
}

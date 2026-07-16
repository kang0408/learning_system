import { Request, Response } from 'express';
import { QuestionsService } from './questions.service';
import { BaseController } from '../../controllers/BaseController';
import { createQuestionSchema, updateQuestionSchema } from './questions.schema';

export class QuestionsController extends BaseController {
  constructor(private readonly questionsService: QuestionsService) {
    super();
    this.createQuestion = this.createQuestion.bind(this);
    this.getQuestions = this.getQuestions.bind(this);
    this.getQuestionById = this.getQuestionById.bind(this);
    this.updateQuestion = this.updateQuestion.bind(this);
    this.togglePublish = this.togglePublish.bind(this);
    this.deleteQuestion = this.deleteQuestion.bind(this);
    this.importCSV = this.importCSV.bind(this);
  }
  async createQuestion(req: any, res: Response) {
    const parseResult = createQuestionSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const q = await this.questionsService.createQuestion(parseResult.data, req.user.userId);
    this.handleSuccess(res, q, 201);
  }

  async getQuestions(req: any, res: Response) {
    const result = await this.questionsService.getQuestions(req.user.userId, req.query);
    this.handleSuccess(res, result.questions, 200, result.meta);
  }

  async getQuestionById(req: any, res: Response) {
    const q = await this.questionsService.getQuestionById(req.params.id, req.user.userId);
    this.handleSuccess(res, q);
  }

  async updateQuestion(req: any, res: Response) {
    const parseResult = updateQuestionSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const q = await this.questionsService.updateQuestion(req.params.id, req.user.userId, parseResult.data);
    this.handleSuccess(res, q);
  }

  async togglePublish(req: any, res: Response) {
    const q = await this.questionsService.togglePublish(req.params.id, req.user.userId);
    this.handleSuccess(res, q);
  }

  async deleteQuestion(req: any, res: Response) {
    await this.questionsService.deleteQuestion(req.params.id, req.user.userId);
    this.handleSuccess(res, null);
  }

  async importCSV(req: any, res: Response) {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    try {
      const csvData = req.file.buffer.toString('utf-8');
      const result = await this.questionsService.importCSV(csvData, req.user.userId);
      this.handleSuccess(res, result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message || 'Error processing CSV' });
    }
  }

  // Topic methods moved to topics.controller.ts
}

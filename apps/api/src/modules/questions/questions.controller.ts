import { Request, Response } from 'express';
import { QuestionsService } from './questions.service';
import { BaseController } from '../../controllers/BaseController';
import { createQuestionSchema, updateQuestionSchema, generateAiQuestionsSchema, bulkCreateQuestionsSchema, aiGeneratedQuestionResponseSchema } from './questions.schema';
import { AiService } from '../ai/ai.service';
import { parseDocumentBuffer } from '../../utils/documentParser';

export class QuestionsController extends BaseController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly aiService: AiService
  ) {
    super();
    this.createQuestion = this.createQuestion.bind(this);
    this.getQuestions = this.getQuestions.bind(this);
    this.getQuestionById = this.getQuestionById.bind(this);
    this.updateQuestion = this.updateQuestion.bind(this);
    this.togglePublish = this.togglePublish.bind(this);
    this.deleteQuestion = this.deleteQuestion.bind(this);
    this.generateAiQuestions = this.generateAiQuestions.bind(this);
    this.bulkCreateQuestions = this.bulkCreateQuestions.bind(this);
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

  async generateAiQuestions(req: any, res: Response) {
    const payload = generateAiQuestionsSchema.parse(req.body);
    let documentText: string | undefined = undefined;

    if (req.file) {
      const parsedDoc = await parseDocumentBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
      documentText = parsedDoc.text;
    }

    const questions = await this.aiService.generateQuizQuestions({
      ...payload,
      documentText,
    });
    const validatedQuestions = aiGeneratedQuestionResponseSchema.parse(questions);
    
    this.handleSuccess(res, validatedQuestions);
  }

  async bulkCreateQuestions(req: any, res: Response) {
    const payload = bulkCreateQuestionsSchema.parse(req.body);
    const createdQuestions = await this.questionsService.bulkCreateQuestions(payload, req.user.userId);
    this.handleSuccess(res, createdQuestions, 201);
  }

  // Topic methods moved to topics.controller.ts
}

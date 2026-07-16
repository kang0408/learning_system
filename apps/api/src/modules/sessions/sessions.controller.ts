import { Request, Response } from 'express';
import { SessionsService } from './sessions.service';
import { BaseController } from '../../controllers/BaseController';
import { startSessionSchema, submitAnswerSchema } from './sessions.schema';

export class SessionsController extends BaseController {
  constructor(private readonly sessionsService: SessionsService) {
    super();
    this.start = this.start.bind(this);
    this.submitAnswer = this.submitAnswer.bind(this);
    this.finish = this.finish.bind(this);
    this.abandon = this.abandon.bind(this);
    this.getInfo = this.getInfo.bind(this);
    this.getResult = this.getResult.bind(this);
  }
  async start(req: any, res: Response) {
    const parseResult = startSessionSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const sessionData = await this.sessionsService.startSession(req.user.userId, parseResult.data.assignment_id);
    this.handleSuccess(res, sessionData, 201);
  }

  async submitAnswer(req: any, res: Response) {
    const { id } = req.params;
    const parseResult = submitAnswerSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const result = await this.sessionsService.submitAnswer(req.user.userId, id, parseResult.data);
    this.handleSuccess(res, result);
  }

  async finish(req: any, res: Response) {
    const { id } = req.params;
    const result = await this.sessionsService.finishSession(req.user.userId, id);
    this.handleSuccess(res, result);
  }

  async abandon(req: any, res: Response) {
    const { id } = req.params;
    await this.sessionsService.abandonSession(req.user.userId, id);
    this.handleSuccess(res, null);
  }

  async getInfo(req: any, res: Response) {
    const { id } = req.params;
    const result = await this.sessionsService.getSessionInfo(req.user.userId, id);
    this.handleSuccess(res, result);
  }

  async getResult(req: any, res: Response) {
    
      const { id } = req.params;
      const result = await this.sessionsService.getSessionResult(req.user.userId, id);
      this.handleSuccess(res, result);
    
  }
}

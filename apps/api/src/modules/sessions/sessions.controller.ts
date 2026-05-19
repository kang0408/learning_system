import { Request, Response } from 'express';
import { SessionsService } from './sessions.service';
import { startSessionSchema, submitAnswerSchema } from './sessions.schema';

export class SessionsController {
  static async start(req: any, res: Response) {
    const parseResult = startSessionSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const sessionData = await SessionsService.startSession(req.user.userId, parseResult.data.assignment_id);
    res.status(201).json({ success: true, data: sessionData });
  }

  static async submitAnswer(req: any, res: Response) {
    const { id } = req.params;
    const parseResult = submitAnswerSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const result = await SessionsService.submitAnswer(req.user.userId, id, parseResult.data);
    res.json({ success: true, data: result });
  }

  static async finish(req: any, res: Response) {
    const { id } = req.params;
    const result = await SessionsService.finishSession(req.user.userId, id);
    res.json({ success: true, data: result });
  }

  static async abandon(req: any, res: Response) {
    const { id } = req.params;
    await SessionsService.abandonSession(req.user.userId, id);
    res.json({ success: true, data: null });
  }

  static async getInfo(req: any, res: Response) {
    const { id } = req.params;
    const result = await SessionsService.getSessionInfo(req.user.userId, id);
    res.json({ success: true, data: result });
  }

  static async getResult(req: any, res: Response) {
    try {
      const { id } = req.params;
      const result = await SessionsService.getSessionResult(req.user.userId, id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: err.message });
    }
  }
}

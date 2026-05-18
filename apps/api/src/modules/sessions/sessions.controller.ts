import { Response } from 'express';
import { SessionsService } from './sessions.service';

export class SessionsController {
  static async start(req: any, res: Response) {
    const { assignmentId } = req.body;
    const sessionData = await SessionsService.startSession(req.user.userId, assignmentId);
    res.status(201).json(sessionData);
  }

  static async submitAnswer(req: any, res: Response) {
    const { sessionId } = req.params;
    const result = await SessionsService.submitAnswer(req.user.userId, sessionId, req.body);
    res.json(result);
  }
}

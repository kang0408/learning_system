import { Response } from 'express';
import { QuestionsService } from './questions.service';
export class QuestionsController {
  static async createQuestion(req: any, res: Response) {
    const q = await QuestionsService.createQuestion(req.body, req.user.userId);
    res.status(201).json(q);
  }
}

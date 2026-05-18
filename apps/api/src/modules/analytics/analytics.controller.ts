import { Response } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  static async getStudentStats(req: any, res: Response) {
    const stats = await AnalyticsService.getStudentDashboard(req.user.userId);
    res.json(stats);
  }
}

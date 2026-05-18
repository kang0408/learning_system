import { Response } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  static async getStudentStats(req: any, res: Response) {
    const stats = await AnalyticsService.getStudentDashboard(req.user.userId);
    res.json(stats);
  }
  static async getTeacherClassStats(req: any, res: Response) {
    const { classId } = req.params;
    const stats = await AnalyticsService.getTeacherClassStats(req.user.userId, classId);
    res.json(stats);
  }
}

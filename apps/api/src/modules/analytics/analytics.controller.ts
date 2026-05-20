import { Response } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  static async getStudentStats(req: any, res: Response) {
    const stats = await AnalyticsService.getStudentDashboard(req.user.userId);
    res.json({ success: true, data: stats });
  }

  static async getStudentCalendar(req: any, res: Response) {
    const data = await AnalyticsService.getStudentCalendar(req.user.userId);
    res.json({ success: true, data });
  }

  static async getStudentWeakTopics(req: any, res: Response) {
    const data = await AnalyticsService.getStudentWeakTopics(req.user.userId);
    res.json({ success: true, data });
  }

  static async getTeacherClassStats(req: any, res: Response) {
    const { classId } = req.params;
    const stats = await AnalyticsService.getTeacherClassStats(req.user.userId, classId);
    res.json({ success: true, data: stats });
  }

  static async getTeacherClassTopics(req: any, res: Response) {
    const { classId } = req.params;
    const topics = await AnalyticsService.getTeacherClassTopics(req.user.userId, classId);
    res.json({ success: true, data: topics });
  }

  static async getTeacherClassStudents(req: any, res: Response) {
    const { classId } = req.params;
    const students = await AnalyticsService.getTeacherClassStudents(req.user.userId, classId);
    res.json({ success: true, data: students });
  }

  static async getTeacherClassTopicStudents(req: any, res: Response) {
    const { classId, topicId } = req.params;
    const students = await AnalyticsService.getTeacherClassTopicStudents(req.user.userId, classId, topicId);
    res.json({ success: true, data: students });
  }

  static async getTeacherStudentStats(req: any, res: Response) {
    const { studentId } = req.params;
    const stats = await AnalyticsService.getTeacherStudentStats(req.user.userId, studentId);
    res.json({ success: true, data: stats });
  }

  static async getParentChildren(req: any, res: Response) {
    const data = await AnalyticsService.getParentChildren(req.user.userId);
    res.json({ success: true, data });
  }

  static async getParentChildWeekly(req: any, res: Response) {
    const { studentId } = req.params;
    const data = await AnalyticsService.getParentChildWeekly(req.user.userId, studentId);
    res.json({ success: true, data });
  }
}

import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { BaseController } from '../../controllers/BaseController';

export class AnalyticsController extends BaseController {
  constructor(private readonly analyticsService: AnalyticsService) {
    super();
    this.getSystemAnalytics = this.getSystemAnalytics.bind(this);
    this.streamSystemAnalytics = this.streamSystemAnalytics.bind(this);
    this.getStudentStats = this.getStudentStats.bind(this);
    this.getStudentCalendar = this.getStudentCalendar.bind(this);
    this.getStudentWeakTopics = this.getStudentWeakTopics.bind(this);
    this.getTeacherClassStats = this.getTeacherClassStats.bind(this);
    this.getTeacherClassTopics = this.getTeacherClassTopics.bind(this);
    this.getTeacherClassStudents = this.getTeacherClassStudents.bind(this);
    this.getTeacherClassTopicStudents = this.getTeacherClassTopicStudents.bind(this);
    this.getTeacherStudentStats = this.getTeacherStudentStats.bind(this);
  }

  // --- ADMIN SYSTEM ANALYTICS ---
  async getSystemAnalytics(req: Request, res: Response) {
    const metrics = await this.analyticsService.getSystemAnalytics();
    this.handleSuccess(res, metrics);
  }

  async streamSystemAnalytics(req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    let intervalId: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const sendMetrics = async () => {
      if (res.writableEnded || res.destroyed) {
        cleanup();
        return;
      }
      try {
        const metrics = await this.analyticsService.getSystemAnalytics();
        if (!res.writableEnded && !res.destroyed) {
          res.write(`data: ${JSON.stringify(metrics)}\n\n`);
        }
      } catch (err) {
        if (!res.writableEnded && !res.destroyed) {
          res.write(`event: error\ndata: ${JSON.stringify({ error: 'Failed to fetch metrics' })}\n\n`);
        }
      }
    };

    await sendMetrics();
    intervalId = setInterval(sendMetrics, 3000);

    req.on('close', cleanup);
    req.on('end', cleanup);
    req.on('error', cleanup);
    res.on('close', cleanup);
    res.on('finish', cleanup);
    res.on('error', cleanup);
  }

  // --- STUDENT ---
  async getStudentStats(req: any, res: Response) {
    const stats = await this.analyticsService.getStudentDashboard(req.user.userId);
    this.handleSuccess(res, stats);
  }

  async getStudentCalendar(req: any, res: Response) {
    const data = await this.analyticsService.getStudentCalendar(req.user.userId);
    this.handleSuccess(res, data);
  }

  async getStudentWeakTopics(req: any, res: Response) {
    const data = await this.analyticsService.getStudentWeakTopics(req.user.userId);
    this.handleSuccess(res, data);
  }

  // --- TEACHER ---
  async getTeacherClassStats(req: any, res: Response) {
    const { classId } = req.params;
    const stats = await this.analyticsService.getTeacherClassStats(req.user.userId, classId);
    this.handleSuccess(res, stats);
  }

  async getTeacherClassTopics(req: any, res: Response) {
    const { classId } = req.params;
    const topics = await this.analyticsService.getTeacherClassTopics(req.user.userId, classId);
    this.handleSuccess(res, topics);
  }

  async getTeacherClassStudents(req: any, res: Response) {
    const { classId } = req.params;
    const students = await this.analyticsService.getTeacherClassStudents(req.user.userId, classId);
    this.handleSuccess(res, students);
  }

  async getTeacherClassTopicStudents(req: any, res: Response) {
    const { classId, topicId } = req.params;
    const students = await this.analyticsService.getTeacherClassTopicStudents(req.user.userId, classId, topicId);
    this.handleSuccess(res, students);
  }

  async getTeacherStudentStats(req: any, res: Response) {
    const { studentId } = req.params;
    const stats = await this.analyticsService.getTeacherStudentStats(req.user.userId, studentId);
    this.handleSuccess(res, stats);
  }
}

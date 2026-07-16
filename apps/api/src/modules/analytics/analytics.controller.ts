import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { BaseController } from '../../controllers/BaseController';

export class AnalyticsController extends BaseController {
  constructor(private readonly analyticsService: AnalyticsService) {
    super();
    this.getStudentStats = this.getStudentStats.bind(this);
    this.getStudentCalendar = this.getStudentCalendar.bind(this);
    this.getStudentWeakTopics = this.getStudentWeakTopics.bind(this);
    this.getTeacherClassStats = this.getTeacherClassStats.bind(this);
    this.getTeacherClassTopics = this.getTeacherClassTopics.bind(this);
    this.getTeacherClassStudents = this.getTeacherClassStudents.bind(this);
    this.getTeacherClassTopicStudents = this.getTeacherClassTopicStudents.bind(this);
    this.getTeacherStudentStats = this.getTeacherStudentStats.bind(this);
    this.getParentChildren = this.getParentChildren.bind(this);
    this.getParentChildWeekly = this.getParentChildWeekly.bind(this);
  }
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

  async getParentChildren(req: any, res: Response) {
    const data = await this.analyticsService.getParentChildren(req.user.userId);
    this.handleSuccess(res, data);
  }

  async getParentChildWeekly(req: any, res: Response) {
    const { studentId } = req.params;
    const data = await this.analyticsService.getParentChildWeekly(req.user.userId, studentId);
    this.handleSuccess(res, data);
  }
}

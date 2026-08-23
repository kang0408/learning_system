import { Request, Response } from 'express';
import { ClassesService } from './classes.service';
import { ClassReportService } from './class-report.service';
import { StudentReportService } from './student-report.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { BaseController } from '../../controllers/BaseController';
import { createClassSchema, updateClassSchema, joinClassSchema } from './classes.schema';

export class ClassesController extends BaseController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly classReportService?: ClassReportService,
    private readonly pdfGeneratorService?: PdfGeneratorService,
    private readonly studentReportService?: StudentReportService
  ) {
    super();
    this.createClass = this.createClass.bind(this);
    this.getTeacherClasses = this.getTeacherClasses.bind(this);
    this.getClassById = this.getClassById.bind(this);
    this.updateClass = this.updateClass.bind(this);
    this.deleteClass = this.deleteClass.bind(this);
    this.getClassMembers = this.getClassMembers.bind(this);
    this.removeMember = this.removeMember.bind(this);
    this.joinClass = this.joinClass.bind(this);
    this.getMyClasses = this.getMyClasses.bind(this);
    this.exportClassReportPdf = this.exportClassReportPdf.bind(this);
    this.getClassReportData = this.getClassReportData.bind(this);
    this.exportStudentReportPdf = this.exportStudentReportPdf.bind(this);
    this.getStudentReportData = this.getStudentReportData.bind(this);
  }

  async createClass(req: any, res: Response) {
    const parseResult = createClassSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const newClass = await this.classesService.createClass(parseResult.data, req.user.userId);
    this.handleSuccess(res, newClass, 201);
  }

  async getTeacherClasses(req: any, res: Response) {
    const classes = await this.classesService.getTeacherClasses(req.user.userId);
    this.handleSuccess(res, classes);
  }

  async getClassById(req: any, res: Response) {
    const classData = await this.classesService.getClassById(req.params.id);
    this.handleSuccess(res, classData);
  }

  async updateClass(req: any, res: Response) {
    const parseResult = updateClassSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const updated = await this.classesService.updateClass(req.params.id, req.user.userId, parseResult.data);
    this.handleSuccess(res, updated);
  }

  async deleteClass(req: any, res: Response) {
    await this.classesService.deleteClass(req.params.id, req.user.userId);
    this.handleSuccess(res, null);
  }

  async getClassMembers(req: any, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await this.classesService.getClassMembers(req.params.id, req.user.userId, page, limit);
    this.handleSuccess(res, result.members, 200, result.meta);
  }

  async removeMember(req: any, res: Response) {
    await this.classesService.removeMember(req.params.id, req.user.userId, req.params.studentId);
    this.handleSuccess(res, null);
  }

  async joinClass(req: any, res: Response) {
    const parseResult = joinClassSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const result = await this.classesService.joinClass(req.user.userId, parseResult.data.join_code);
    this.handleSuccess(res, result);
  }

  async getMyClasses(req: any, res: Response) {
    const classes = await this.classesService.getMyClasses(req.user.userId);
    this.handleSuccess(res, classes);
  }

  async exportClassReportPdf(req: any, res: Response) {
    if (!this.classReportService || !this.pdfGeneratorService) {
      return res.status(500).json({ success: false, message: 'Report services not configured' });
    }

    const classId = req.params.id;
    const teacherId = req.user.userId;

    const reportData = await this.classReportService.getCompleteReportData(classId, teacherId);
    if (!reportData) {
      return res.status(404).json({ success: false, message: 'Class not found or access denied' });
    }

    const pdfBuffer = await this.pdfGeneratorService.generateClassReportPdf(reportData);

    const safeClassName = (reportData.class_info.name || 'Lop_Hoc')
      .replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_')
      .substring(0, 30);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bao_Cao_Lop_${safeClassName}_${dateStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  }

  async getClassReportData(req: any, res: Response) {
    if (!this.classReportService) {
      return res.status(500).json({ success: false, message: 'Report service not configured' });
    }

    const classId = req.params.id;
    const teacherId = req.user.userId;

    const reportData = await this.classReportService.getCompleteReportData(classId, teacherId);
    if (!reportData) {
      return res.status(404).json({ success: false, message: 'Class not found or access denied' });
    }

    this.handleSuccess(res, reportData);
  }

  async exportStudentReportPdf(req: any, res: Response) {
    if (!this.studentReportService || !this.pdfGeneratorService) {
      return res.status(500).json({ success: false, message: 'Student report services not configured' });
    }

    const { classId, studentId } = req.params;
    const teacherId = req.user.userId;

    const reportData = await this.studentReportService.getStudentReportData(classId, studentId, teacherId);
    if (!reportData) {
      return res.status(404).json({ success: false, message: 'Student report data not found or access denied' });
    }

    const pdfBuffer = await this.pdfGeneratorService.generateStudentReportPdf(reportData);

    const safeStudentName = (reportData.student_info.name || 'Hoc_Sinh')
      .replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_')
      .substring(0, 30);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bao_Cao_Hoc_Sinh_${safeStudentName}_${dateStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  }

  async getStudentReportData(req: any, res: Response) {
    if (!this.studentReportService) {
      return res.status(500).json({ success: false, message: 'Student report service not configured' });
    }

    const { classId, studentId } = req.params;
    const teacherId = req.user.userId;

    const reportData = await this.studentReportService.getStudentReportData(classId, studentId, teacherId);
    if (!reportData) {
      return res.status(404).json({ success: false, message: 'Student report data not found or access denied' });
    }

    this.handleSuccess(res, reportData);
  }
}


import { Request, Response } from 'express';
import { ClassesService } from './classes.service';
import { BaseController } from '../../controllers/BaseController';
import { createClassSchema, updateClassSchema, joinClassSchema } from './classes.schema';

export class ClassesController extends BaseController {
  constructor(private readonly classesService: ClassesService) {
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
}

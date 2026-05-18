import { Request, Response } from 'express';
import { ClassesService } from './classes.service';
import { createClassSchema, updateClassSchema, joinClassSchema } from './classes.schema';

export class ClassesController {
  static async createClass(req: any, res: Response) {
    const parseResult = createClassSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const newClass = await ClassesService.createClass(parseResult.data, req.user.userId);
    res.status(201).json({ success: true, data: newClass });
  }

  static async getTeacherClasses(req: any, res: Response) {
    const classes = await ClassesService.getTeacherClasses(req.user.userId);
    res.json({ success: true, data: classes });
  }

  static async getClassById(req: any, res: Response) {
    const classData = await ClassesService.getClassById(req.params.id);
    res.json({ success: true, data: classData });
  }

  static async updateClass(req: any, res: Response) {
    const parseResult = updateClassSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const updated = await ClassesService.updateClass(req.params.id, req.user.userId, parseResult.data);
    res.json({ success: true, data: updated });
  }

  static async deleteClass(req: any, res: Response) {
    await ClassesService.deleteClass(req.params.id, req.user.userId);
    res.json({ success: true, data: null });
  }

  static async getClassMembers(req: any, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await ClassesService.getClassMembers(req.params.id, req.user.userId, page, limit);
    res.json({ success: true, data: result.members, meta: result.meta });
  }

  static async removeMember(req: any, res: Response) {
    await ClassesService.removeMember(req.params.id, req.user.userId, req.params.studentId);
    res.json({ success: true, data: null });
  }

  static async joinClass(req: any, res: Response) {
    const parseResult = joinClassSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const result = await ClassesService.joinClass(req.user.userId, parseResult.data.join_code);
    res.json({ success: true, data: result });
  }

  static async getMyClasses(req: any, res: Response) {
    const classes = await ClassesService.getMyClasses(req.user.userId);
    res.json({ success: true, data: classes });
  }
}

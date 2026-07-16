import { Response } from 'express';
import { ParentService } from './parent.service';
import { BaseController } from '../../controllers/BaseController';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class ParentController extends BaseController {
  constructor(private readonly parentService: ParentService) {
    super();
    this.linkStudent = this.linkStudent.bind(this);
    this.getChildren = this.getChildren.bind(this);
    this.unlinkStudent = this.unlinkStudent.bind(this);
  }

  async linkStudent(req: AuthRequest, res: Response) {
    const { studentEmail } = req.body;
    const link = await this.parentService.linkStudent(req.user!.userId, studentEmail);
    res.status(201).json({ success: true, data: link });
  }

  async getChildren(req: AuthRequest, res: Response) {
    const children = await this.parentService.getChildren(req.user!.userId);
    this.handleSuccess(res, children);
  }

  async unlinkStudent(req: AuthRequest, res: Response) {
    const studentId = req.params.studentId as string;
    await this.parentService.unlinkStudent(req.user!.userId, studentId);
    this.handleSuccess(res, null);
  }
}

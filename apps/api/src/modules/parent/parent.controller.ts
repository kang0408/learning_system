import { Response } from 'express';
import { ParentService } from './parent.service';

export class ParentController {
  static async linkStudent(req: any, res: Response) {
    const { studentEmail } = req.body;
    const link = await ParentService.linkStudent(req.user.userId, studentEmail);
    res.status(201).json({ success: true, data: link });
  }
}

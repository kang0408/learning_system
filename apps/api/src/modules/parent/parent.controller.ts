import { Response } from 'express';
import { ParentService } from './parent.service';

export class ParentController {
  static async linkStudent(req: any, res: Response) {
    const { studentEmail } = req.body;
    const link = await ParentService.linkStudent(req.user.userId, studentEmail);
    res.status(201).json({ success: true, data: link });
  }

  static async getChildren(req: any, res: Response) {
    try {
      const children = await ParentService.getChildren(req.user.userId);
      res.json({ success: true, data: children });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: err.message });
    }
  }

  static async unlinkStudent(req: any, res: Response) {
    try {
      const { studentId } = req.params;
      await ParentService.unlinkStudent(req.user.userId, studentId);
      res.json({ success: true, data: null });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: err.message });
    }
  }
}

import { Request, Response } from 'express';
import { SM2Service } from './sm2.service';

export class SM2Controller {
  static async getDailySchedule(req: any, res: Response) {
    try {
      const schedule = await SM2Service.getDailySchedule(req.user.userId);
      res.json({ success: true, data: schedule });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: err.message });
    }
  }
}

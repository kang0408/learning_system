import { Request, Response } from 'express';
import { SM2Service } from './sm2.service';
import { BaseController } from '../../controllers/BaseController';

export class SM2Controller extends BaseController {
  constructor(private readonly sm2Service: SM2Service) {
    super();
    this.getDailySchedule = this.getDailySchedule.bind(this);
  }
  async getDailySchedule(req: any, res: Response) {
    
      const schedule = await this.sm2Service.getDailySchedule(req.user.userId);
      this.handleSuccess(res, schedule);
    
  }
}

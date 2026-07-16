import { Response } from 'express';

export abstract class BaseController {
  protected handleSuccess(res: Response, data: any, statusCode: number = 200, meta?: any): void {
    res.status(statusCode).json({
      success: true,
      data,
      ...(meta && { meta })
    });
  }
}

import { Request, Response } from 'express';
import { ClassesService } from './classes.service';
import { createClassSchema } from './classes.schema';

export class ClassesController {
  static async createClass(req: any, res: Response) {
    const parseResult = createClassSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ error: parseResult.error });
    const newClass = await ClassesService.createClass(parseResult.data, req.user.userId);
    res.status(201).json(newClass);
  }
}

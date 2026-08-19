import { Response } from 'express';
import { BaseController } from '../../controllers/BaseController';
import { CurriculumsService } from './curriculums.service';
import { createCurriculumSchema, updateCurriculumSchema, reorderCurriculumsSchema } from './curriculums.schema';

export class CurriculumsController extends BaseController {
  constructor(private readonly curriculumsService: CurriculumsService) {
    super();
    this.createCurriculum = this.createCurriculum.bind(this);
    this.getCurriculumsByClass = this.getCurriculumsByClass.bind(this);
    this.getCurriculumById = this.getCurriculumById.bind(this);
    this.updateCurriculum = this.updateCurriculum.bind(this);
    this.deleteCurriculum = this.deleteCurriculum.bind(this);
    this.reorderCurriculums = this.reorderCurriculums.bind(this);
  }

  async createCurriculum(req: any, res: Response) {
    const parseResult = createCurriculumSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error });
    }
    const result = await this.curriculumsService.createCurriculum(
      req.params.classId,
      req.user.userId,
      parseResult.data
    );
    this.handleSuccess(res, result, 201);
  }

  async getCurriculumsByClass(req: any, res: Response) {
    const result = await this.curriculumsService.getCurriculumsByClass(
      req.params.classId,
      { userId: req.user.userId, role: req.user.role }
    );
    this.handleSuccess(res, result);
  }

  async getCurriculumById(req: any, res: Response) {
    const result = await this.curriculumsService.getCurriculumById(
      req.params.id,
      { userId: req.user.userId, role: req.user.role }
    );
    this.handleSuccess(res, result);
  }

  async updateCurriculum(req: any, res: Response) {
    const parseResult = updateCurriculumSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error });
    }
    const result = await this.curriculumsService.updateCurriculum(
      req.params.id,
      req.user.userId,
      parseResult.data
    );
    this.handleSuccess(res, result);
  }

  async deleteCurriculum(req: any, res: Response) {
    const result = await this.curriculumsService.deleteCurriculum(
      req.params.id,
      req.user.userId
    );
    this.handleSuccess(res, result);
  }

  async reorderCurriculums(req: any, res: Response) {
    const parseResult = reorderCurriculumsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error });
    }
    const result = await this.curriculumsService.reorderCurriculums(
      req.params.classId,
      req.user.userId,
      parseResult.data
    );
    this.handleSuccess(res, result);
  }
}

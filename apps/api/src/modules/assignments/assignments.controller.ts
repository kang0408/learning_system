import { Request, Response } from 'express';
import { AssignmentsService } from './assignments.service';
import { BaseController } from '../../controllers/BaseController';
import { createAssignmentSchema, updateAssignmentSchema } from './assignments.schema';

export class AssignmentsController extends BaseController {
  constructor(private readonly assignmentsService: AssignmentsService) {
    super();
    this.createAssignment = this.createAssignment.bind(this);
    this.getAssignments = this.getAssignments.bind(this);
    this.getAssignmentById = this.getAssignmentById.bind(this);
    this.updateAssignment = this.updateAssignment.bind(this);
    this.deleteAssignment = this.deleteAssignment.bind(this);
    this.publishAssignment = this.publishAssignment.bind(this);
    this.unpublishAssignment = this.unpublishAssignment.bind(this);
    this.getMyAssignments = this.getMyAssignments.bind(this);
  }
  async createAssignment(req: any, res: Response) {
    const parseResult = createAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const assignment = await this.assignmentsService.createAssignment(parseResult.data, req.user.userId);
    this.handleSuccess(res, assignment, 201);
  }

  async getAssignments(req: any, res: Response) {
    const result = await this.assignmentsService.getAssignments(req.user.userId, req.query);
    this.handleSuccess(res, result.assignments, 200, result.meta);
  }

  async getAssignmentById(req: any, res: Response) {
    const assignment = await this.assignmentsService.getAssignmentById(req.params.id, req.user.userId, req.user.role);
    this.handleSuccess(res, assignment);
  }

  async updateAssignment(req: any, res: Response) {
    const parseResult = updateAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const assignment = await this.assignmentsService.updateAssignment(req.params.id, req.user.userId, parseResult.data);
    this.handleSuccess(res, assignment);
  }

  async deleteAssignment(req: any, res: Response) {
    await this.assignmentsService.deleteAssignment(req.params.id, req.user.userId);
    this.handleSuccess(res, null);
  }

  async publishAssignment(req: any, res: Response) {
    const assignment = await this.assignmentsService.publishAssignment(req.params.id, req.user.userId);
    this.handleSuccess(res, assignment);
  }

  async unpublishAssignment(req: any, res: Response) {
    const assignment = await this.assignmentsService.unpublishAssignment(req.params.id, req.user.userId);
    this.handleSuccess(res, assignment);
  }

  async getMyAssignments(req: any, res: Response) {
    const result = await this.assignmentsService.getMyAssignments(req.user.userId, req.query);
    this.handleSuccess(res, result.assignments, 200, result.meta);
  }
}

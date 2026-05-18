import { Request, Response } from 'express';
import { AssignmentsService } from './assignments.service';
import { createAssignmentSchema, updateAssignmentSchema } from './assignments.schema';

export class AssignmentsController {
  static async createAssignment(req: any, res: Response) {
    const parseResult = createAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const assignment = await AssignmentsService.createAssignment(parseResult.data, req.user.userId);
    res.status(201).json({ success: true, data: assignment });
  }

  static async getAssignments(req: any, res: Response) {
    const result = await AssignmentsService.getAssignments(req.user.userId, req.query);
    res.json({ success: true, data: result.assignments, meta: result.meta });
  }

  static async getAssignmentById(req: any, res: Response) {
    const assignment = await AssignmentsService.getAssignmentById(req.params.id, req.user.userId, req.user.role);
    res.json({ success: true, data: assignment });
  }

  static async updateAssignment(req: any, res: Response) {
    const parseResult = updateAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ success: false, error: parseResult.error });
    const assignment = await AssignmentsService.updateAssignment(req.params.id, req.user.userId, parseResult.data);
    res.json({ success: true, data: assignment });
  }

  static async deleteAssignment(req: any, res: Response) {
    await AssignmentsService.deleteAssignment(req.params.id, req.user.userId);
    res.json({ success: true, data: null });
  }

  static async publishAssignment(req: any, res: Response) {
    const assignment = await AssignmentsService.publishAssignment(req.params.id, req.user.userId);
    res.json({ success: true, data: assignment });
  }

  static async unpublishAssignment(req: any, res: Response) {
    const assignment = await AssignmentsService.unpublishAssignment(req.params.id, req.user.userId);
    res.json({ success: true, data: assignment });
  }

  static async getMyAssignments(req: any, res: Response) {
    const result = await AssignmentsService.getMyAssignments(req.user.userId, req.query);
    res.json({ success: true, data: result.assignments, meta: result.meta });
  }
}

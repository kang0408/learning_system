import { prisma } from '../../lib/prisma';

export class AssignmentsService {
  static async createAssignment(data: any, teacherId: string) {
    // Verify class ownership
    const classData = await prisma.class.findUnique({ where: { id: data.class_id } });
    if (!classData || classData.teacher_id !== teacherId) {
      throw { status: 403, message: 'Forbidden: Class does not belong to you' };
    }

    return prisma.assignment.create({
      data: {
        class_id: data.class_id,
        created_by: teacherId,
        title: data.title,
        description: data.description,
        mode: data.mode,
        deadline: data.deadline ? new Date(data.deadline) : null,
        max_attempts: data.max_attempts,
        time_limit: data.time_limit,
        assignment_questions: {
          create: data.question_ids.map((qId: string, index: number) => ({
            question_id: qId,
            order_index: index
          }))
        }
      },
      include: { assignment_questions: true }
    });
  }

  static async getAssignments(teacherId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;

    const where = { created_by: teacherId, deleted_at: null };
    const assignments = await prisma.assignment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' }
    });
    
    const total = await prisma.assignment.count({ where });
    return { assignments, meta: { page, limit, total } };
  }

  static async getAssignmentById(id: string, userId: string, role: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id, deleted_at: null },
      include: {
        assignment_questions: { include: { question: true } },
        class: true
      }
    });

    if (!assignment) throw { status: 404, message: 'Assignment not found' };

    if (role === 'teacher' && assignment.created_by !== userId) {
      throw { status: 403, message: 'Forbidden' };
    }

    if (role === 'student') {
      const isMember = await prisma.classMember.findUnique({
        where: { class_id_student_id: { class_id: assignment.class_id, student_id: userId } }
      });
      if (!isMember || !isMember.is_active) throw { status: 403, message: 'Forbidden' };
      if (!assignment.is_published) throw { status: 403, message: 'Assignment not published' };
    }

    return assignment;
  }

  static async updateAssignment(id: string, teacherId: string, data: any) {
    const assignment = await this.getAssignmentById(id, teacherId, 'teacher');
    
    return prisma.$transaction(async (tx) => {
      if (data.question_ids) {
        await tx.assignmentQuestion.deleteMany({ where: { assignment_id: id } });
      }

      return tx.assignment.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          mode: data.mode,
          deadline: data.deadline ? new Date(data.deadline) : null,
          max_attempts: data.max_attempts,
          time_limit: data.time_limit,
          updated_at: new Date(),
          ...(data.question_ids && {
            assignment_questions: {
              create: data.question_ids.map((qId: string, index: number) => ({
                question_id: qId,
                order_index: index
              }))
            }
          })
        },
        include: { assignment_questions: true }
      });
    });
  }

  static async deleteAssignment(id: string, teacherId: string) {
    await this.getAssignmentById(id, teacherId, 'teacher');
    return prisma.assignment.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
  }

  static async publishAssignment(id: string, teacherId: string) {
    await this.getAssignmentById(id, teacherId, 'teacher');
    return prisma.assignment.update({
      where: { id },
      data: { is_published: true, published_at: new Date(), updated_at: new Date() }
    });
  }

  static async unpublishAssignment(id: string, teacherId: string) {
    await this.getAssignmentById(id, teacherId, 'teacher');
    return prisma.assignment.update({
      where: { id },
      data: { is_published: false, updated_at: new Date() }
    });
  }

  static async getMyAssignments(studentId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const status = query.status || 'pending';

    const memberClasses = await prisma.classMember.findMany({
      where: { student_id: studentId, is_active: true },
      select: { class_id: true }
    });
    const classIds = memberClasses.map(mc => mc.class_id);

    const where: any = {
      class_id: { in: classIds },
      is_published: true,
      deleted_at: null
    };

    if (status === 'overdue') {
      where.deadline = { lt: new Date() };
    } else if (status === 'pending') {
      where.OR = [
        { deadline: null },
        { deadline: { gte: new Date() } }
      ];
    }
    // "completed" logic would normally filter by max_attempts reached or quiz_sessions status, keeping simple here

    const assignments = await prisma.assignment.findMany({
      where,
      include: { class: { select: { name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' }
    });
    
    const total = await prisma.assignment.count({ where });
    return { assignments, meta: { page, limit, total } };
  }
}

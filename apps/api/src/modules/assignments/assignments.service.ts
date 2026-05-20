import { prisma } from '../../lib/prisma';

export class AssignmentsService {
  static async createAssignment(data: any, teacherId: string) {
    // Verify class ownership
    const classData = await prisma.class.findUnique({ where: { id: data.class_id } });
    if (!classData || classData.teacher_id !== teacherId) {
      throw { status: 403, message: 'Forbidden: Class does not belong to you' };
    }

    let allQuestionIds: string[] = [];

    if (data.question_ids && data.question_ids.length > 0) {
      allQuestionIds.push(...data.question_ids);
    }

    if (data.topic_ids && data.topic_ids.length > 0) {
      const setQuestions = await prisma.question.findMany({
        where: { topic_id: { in: data.topic_ids }, deleted_at: null },
        select: { id: true },
        orderBy: { created_at: 'asc' }
      });
      allQuestionIds.push(...setQuestions.map(q => q.id));
    }

    // Remove duplicates
    allQuestionIds = [...new Set(allQuestionIds)];

    if (allQuestionIds.length === 0) {
      throw { status: 400, message: 'Phải chọn ít nhất một câu hỏi hoặc bộ câu hỏi có chứa câu hỏi' };
    }

    const isAllStudents = !data.student_ids || data.student_ids.length === 0;

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
        is_all_students: isAllStudents,
        assignment_questions: {
          create: allQuestionIds.map((qId, index) => ({
            question_id: qId,
            order_index: index
          }))
        },
        ...(!isAllStudents && {
          assigned_students: {
            create: data.student_ids.map((sId: string) => ({ student_id: sId }))
          }
        })
      },
      include: { assignment_questions: true, assigned_students: true }
    });
  }

  static async getAssignments(teacherId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;

    const where: any = { created_by: teacherId, deleted_at: null };
    if (query.class_id) {
      where.class_id = query.class_id;
    }

    if (query.student_id) {
      where.OR = [
        { is_all_students: true },
        { assigned_students: { some: { student_id: query.student_id } } }
      ];
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        assigned_students: {
          include: { student: { select: { id: true, full_name: true, email: true } } }
        },
        quiz_sessions: true
      },
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
        class: true,
        assigned_students: {
          include: { student: { select: { id: true, full_name: true, email: true } } }
        }
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
      
      if (!assignment.is_all_students) {
        const isAssigned = assignment.assigned_students.some(s => s.student_id === userId);
        if (!isAssigned) throw { status: 403, message: 'Assignment is not assigned to you' };
      }
    }

    return assignment;
  }

  static async updateAssignment(id: string, teacherId: string, data: any) {
    const assignment = await this.getAssignmentById(id, teacherId, 'teacher');
    
    let questionsToAssignIds: string[] | undefined = undefined;
    if (data.topic_ids || data.question_ids) {
      questionsToAssignIds = [];
      
      if (data.question_ids && data.question_ids.length > 0) {
        questionsToAssignIds.push(...data.question_ids);
      }

      if (data.topic_ids && data.topic_ids.length > 0) {
        const setQuestions = await prisma.question.findMany({
          where: { topic_id: { in: data.topic_ids }, deleted_at: null },
          select: { id: true },
          orderBy: { created_at: 'asc' }
        });
        questionsToAssignIds.push(...setQuestions.map(q => q.id));
      }

      questionsToAssignIds = [...new Set(questionsToAssignIds)];

      if (questionsToAssignIds.length === 0) {
        throw { status: 400, message: 'Phải chọn ít nhất một câu hỏi hoặc bộ câu hỏi có chứa câu hỏi' };
      }
    }

    return prisma.$transaction(async (tx) => {
      if (questionsToAssignIds) {
        await tx.assignmentQuestion.deleteMany({ where: { assignment_id: id } });
      }

      if (data.student_ids) {
        await tx.assignmentStudent.deleteMany({ where: { assignment_id: id } });
      }

      const isAllStudents = data.student_ids ? data.student_ids.length === 0 : assignment.is_all_students;

      return tx.assignment.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          mode: data.mode,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
          max_attempts: data.max_attempts,
          time_limit: data.time_limit,
          updated_at: new Date(),
          is_all_students: isAllStudents,
          ...(questionsToAssignIds && {
            assignment_questions: {
              create: questionsToAssignIds.map((qId, index) => ({
                question_id: qId,
                order_index: index
              }))
            }
          }),
          ...(data.student_ids && data.student_ids.length > 0 && {
            assigned_students: {
              create: data.student_ids.map((sId: string) => ({ student_id: sId }))
            }
          })
        },
        include: { assignment_questions: true, assigned_students: true }
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
    
    // Filter by class_id if provided, otherwise use all classes the student is in
    const targetClassIds = query.class_id 
      ? memberClasses.filter(mc => mc.class_id === query.class_id).map(mc => mc.class_id)
      : memberClasses.map(mc => mc.class_id);

    const baseWhere: any = {
      class_id: { in: targetClassIds },
      is_published: true,
      deleted_at: null,
      OR: [
        { is_all_students: true },
        { assigned_students: { some: { student_id: studentId } } }
      ]
    };

    if (status === 'overdue') {
      baseWhere.deadline = { lt: new Date() };
    } else if (status === 'pending') {
      // Must use AND because we already have an OR at the top level
      baseWhere.AND = [
        {
          OR: [
            { deadline: null },
            { deadline: { gte: new Date() } }
          ]
        }
      ];
    }

    const assignments = await prisma.assignment.findMany({
      where: baseWhere,
      include: { 
        class: { select: { name: true } },
        quiz_sessions: {
          where: { student_id: studentId },
          orderBy: { started_at: 'desc' }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' }
    });
    
    const total = await prisma.assignment.count({ where: baseWhere });
    return { assignments, meta: { page, limit, total } };
  }
}

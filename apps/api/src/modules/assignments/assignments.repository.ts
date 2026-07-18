import { PrismaClient, Prisma } from '@prisma/client';

export class AssignmentsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findClassById(id: string) {
    return this.prisma.class.findUnique({ where: { id } });
  }

  async findAllTopics(teacherId: string) {
    return this.prisma.topic.findMany({
      where: { created_by: teacherId, deleted_at: null },
      select: { id: true, parent_id: true }
    });
  }

  async findQuestionsByTopicIds(topicIds: string[]) {
    return this.prisma.question.findMany({
      where: { topic_id: { in: topicIds }, deleted_at: null },
      select: { id: true },
      orderBy: { created_at: 'asc' }
    });
  }

  async createAssignment(data: Prisma.AssignmentUncheckedCreateInput) {
    return this.prisma.assignment.create({
      data,
      include: { assignment_questions: true, assigned_students: true }
    });
  }

  async findAssignments(where: Prisma.AssignmentWhereInput, skip: number, take: number) {
    return this.prisma.assignment.findMany({
      where,
      include: {
        assigned_students: {
          select: { student_id: true }
        },
        class: {
          select: {
            _count: {
              select: { members: { where: { is_active: true } } }
            }
          }
        },
        quiz_sessions: {
          select: { id: true, student_id: true, status: true, score: true }
        }
      },
      skip,
      take,
      orderBy: { created_at: 'desc' }
    });
  }

  async countAssignments(where: Prisma.AssignmentWhereInput) {
    return this.prisma.assignment.count({ where });
  }

  async findAssignmentById(id: string) {
    return this.prisma.assignment.findUnique({
      where: { id, deleted_at: null },
      include: {
        assignment_questions: { include: { question: true } },
        class: true,
        assigned_students: {
          include: { student: { select: { id: true, full_name: true, email: true } } }
        }
      }
    });
  }

  async checkClassMembership(classId: string, studentId: string) {
    return this.prisma.classMember.findUnique({
      where: { class_id_student_id: { class_id: classId, student_id: studentId } }
    });
  }

  async getStudentActiveClasses(studentId: string) {
    return this.prisma.classMember.findMany({
      where: { student_id: studentId, is_active: true },
      select: { class_id: true }
    });
  }

  async findStudentAssignments(where: Prisma.AssignmentWhereInput, studentId: string, skip: number, take: number) {
    return this.prisma.assignment.findMany({
      where,
      include: { 
        class: { select: { name: true } },
        quiz_sessions: {
          where: { student_id: studentId },
          orderBy: { started_at: 'desc' }
        }
      },
      skip,
      take,
      orderBy: { created_at: 'desc' }
    });
  }

  async executeTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async updateAssignment(id: string, data: Prisma.AssignmentUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.assignment.update({
      where: { id },
      data,
      include: { assignment_questions: true, assigned_students: true }
    });
  }

  async deleteAssignmentQuestions(assignmentId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.assignmentQuestion.deleteMany({ where: { assignment_id: assignmentId } });
  }

  async deleteAssignmentStudents(assignmentId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.assignmentStudent.deleteMany({ where: { assignment_id: assignmentId } });
  }

  async getStudentsForAssignment(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        assigned_students: {
          include: { student: { select: { email: true, full_name: true } } }
        },
        class: {
          include: {
            members: {
              where: { is_active: true },
              include: { student: { select: { email: true, full_name: true } } }
            }
          }
        }
      }
    });

    if (!assignment) return [];

    if (assignment.is_all_students) {
      return assignment.class.members.map(m => m.student);
    } else {
      return assignment.assigned_students.map(m => m.student);
    }
  }

  async findPendingAssignmentsDueIn24h() {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.assignment.findMany({
      where: {
        is_published: true,
        deleted_at: null,
        deadline: {
          gte: now,
          lte: next24h,
        }
      },
      include: {
        assigned_students: {
          include: { student: { select: { id: true, email: true, full_name: true } } }
        },
        class: {
          include: {
            members: {
              where: { is_active: true },
              include: { student: { select: { id: true, email: true, full_name: true } } }
            }
          }
        },
        quiz_sessions: {
          where: { status: 'completed' },
          select: { student_id: true }
        }
      }
    });
  }
}

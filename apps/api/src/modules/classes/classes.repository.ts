import { PrismaClient, Prisma } from '@prisma/client';

export class ClassesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createClass(data: Prisma.ClassUncheckedCreateInput) {
    return this.prisma.class.create({ data });
  }

  async findTeacherClasses(teacherId: string) {
    return this.prisma.class.findMany({
      where: { teacher_id: teacherId, deleted_at: null },
      include: {
        _count: { select: { members: { where: { is_active: true } } } }
      }
    });
  }

  async findClassById(classId: string) {
    return this.prisma.class.findUnique({
      where: { id: classId, deleted_at: null },
      include: {
        teacher: { select: { full_name: true, email: true } },
        _count: { select: { members: { where: { is_active: true } } } }
      }
    });
  }

  async updateClass(classId: string, data: Prisma.ClassUpdateInput) {
    return this.prisma.class.update({
      where: { id: classId },
      data
    });
  }

  async findClassMembers(classId: string, skip: number, take: number) {
    return this.prisma.classMember.findMany({
      where: { class_id: classId, is_active: true },
      include: {
        student: { select: { id: true, full_name: true, email: true, avatar_url: true } }
      },
      skip,
      take
    });
  }

  async countClassMembers(classId: string) {
    return this.prisma.classMember.count({ where: { class_id: classId, is_active: true } });
  }

  async deactivateMember(classId: string, studentId: string) {
    return this.prisma.classMember.update({
      where: { class_id_student_id: { class_id: classId, student_id: studentId } },
      data: { is_active: false }
    });
  }

  async findClassByJoinCode(joinCode: string) {
    return this.prisma.class.findUnique({
      where: { join_code: joinCode, deleted_at: null }
    });
  }

  async checkMembership(classId: string, studentId: string) {
    return this.prisma.classMember.findUnique({
      where: { class_id_student_id: { class_id: classId, student_id: studentId } }
    });
  }

  async reactivateMember(membershipId: string) {
    return this.prisma.classMember.update({
      where: { id: membershipId },
      data: { is_active: true, joined_at: new Date() }
    });
  }

  async createMember(classId: string, studentId: string) {
    return this.prisma.classMember.create({
      data: {
        class_id: classId,
        student_id: studentId
      }
    });
  }

  async findStudentClasses(studentId: string) {
    return this.prisma.classMember.findMany({
      where: { student_id: studentId, is_active: true },
      include: {
        class: {
          include: { teacher: { select: { full_name: true } } }
        }
      }
    });
  }
}

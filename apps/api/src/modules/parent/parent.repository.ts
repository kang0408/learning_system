import { PrismaClient } from '@prisma/client';

export class ParentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findStudentByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createParentStudentLink(parentId: string, studentId: string) {
    return this.prisma.parentStudentLink.create({
      data: { parent_id: parentId, student_id: studentId }
    });
  }

  async getChildren(parentId: string) {
    return this.prisma.parentStudentLink.findMany({
      where: { parent_id: parentId, is_active: true },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            full_name: true,
            avatar_url: true,
            created_at: true
          }
        }
      }
    });
  }

  async findLink(parentId: string, studentId: string) {
    return this.prisma.parentStudentLink.findUnique({
      where: { parent_id_student_id: { parent_id: parentId, student_id: studentId } }
    });
  }

  async deleteLink(linkId: string) {
    return this.prisma.parentStudentLink.delete({
      where: { id: linkId }
    });
  }
}

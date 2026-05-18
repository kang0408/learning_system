import { prisma } from '../../lib/prisma';

export class ParentService {
  static async linkStudent(parentId: string, studentEmail: string) {
    const student = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student || student.role !== 'student') throw { status: 404, message: 'Student not found' };

    return prisma.parentStudentLink.create({
      data: { parent_id: parentId, student_id: student.id }
    });
  }

  static async getChildrenList(parentId: string) {
    const links = await prisma.parentStudentLink.findMany({
      where: { parent_id: parentId },
      include: { student: { select: { id: true, full_name: true, email: true } } }
    });
    return links.map((l: any) => l.student);
  }
}

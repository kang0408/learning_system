import { prisma } from '../../lib/prisma';

export class ParentService {
  static async linkStudent(parentId: string, studentEmail: string) {
    const student = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student || student.role !== 'student') throw { status: 404, message: 'Student not found' };

    return prisma.parentStudentLink.create({
      data: { parent_id: parentId, student_id: student.id }
    });
  }

  static async getChildren(parentId: string) {
    const links = await prisma.parentStudentLink.findMany({
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
    
    return links.map(link => ({
      link_id: link.id,
      student_id: link.student.id,
      email: link.student.email,
      full_name: link.student.full_name,
      avatar_url: link.student.avatar_url,
      linked_at: link.linked_at
    }));
  }

  static async unlinkStudent(parentId: string, studentId: string) {
    const link = await prisma.parentStudentLink.findUnique({
      where: { parent_id_student_id: { parent_id: parentId, student_id: studentId } }
    });
    
    if (!link) throw { status: 404, message: 'Link not found' };

    await prisma.parentStudentLink.delete({
      where: { id: link.id }
    });
    
    return true;
  }
}

import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

export class ClassesService {
  static async createClass(data: any, teacherId: string) {
    const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    return prisma.class.create({
      data: {
        name: data.name,
        subject: data.subject,
        description: data.description,
        join_code: joinCode,
        teacher_id: teacherId
      }
    });
  }

  static async getTeacherClasses(teacherId: string) {
    return prisma.class.findMany({
      where: { teacher_id: teacherId, deleted_at: null },
      include: {
        _count: { select: { members: { where: { is_active: true } } } }
      }
    });
  }

  static async getClassById(classId: string) {
    const classData = await prisma.class.findUnique({
      where: { id: classId, deleted_at: null },
      include: {
        teacher: { select: { full_name: true, email: true } },
        _count: { select: { members: { where: { is_active: true } } } }
      }
    });
    if (!classData) throw { status: 404, message: 'Class not found' };
    return classData;
  }

  static async updateClass(classId: string, teacherId: string, data: any) {
    const classData = await this.getClassById(classId);
    if (classData.teacher_id !== teacherId) throw { status: 403, message: 'Forbidden' };
    
    return prisma.class.update({
      where: { id: classId },
      data: { ...data, updated_at: new Date() }
    });
  }

  static async deleteClass(classId: string, teacherId: string) {
    const classData = await this.getClassById(classId);
    if (classData.teacher_id !== teacherId) throw { status: 403, message: 'Forbidden' };

    return prisma.class.update({
      where: { id: classId },
      data: { deleted_at: new Date() }
    });
  }

  static async getClassMembers(classId: string, teacherId: string, page = 1, limit = 20) {
    const classData = await this.getClassById(classId);
    if (classData.teacher_id !== teacherId) throw { status: 403, message: 'Forbidden' };

    const members = await prisma.classMember.findMany({
      where: { class_id: classId, is_active: true },
      include: {
        student: { select: { id: true, full_name: true, email: true, avatar_url: true } }
      },
      skip: (page - 1) * limit,
      take: limit
    });
    
    const total = await prisma.classMember.count({ where: { class_id: classId, is_active: true } });
    return { members, meta: { page, limit, total } };
  }

  static async removeMember(classId: string, teacherId: string, studentId: string) {
    const classData = await this.getClassById(classId);
    if (classData.teacher_id !== teacherId) throw { status: 403, message: 'Forbidden' };

    return prisma.classMember.update({
      where: { class_id_student_id: { class_id: classId, student_id: studentId } },
      data: { is_active: false }
    });
  }

  static async joinClass(studentId: string, joinCode: string) {
    const classData = await prisma.class.findUnique({
      where: { join_code: joinCode, deleted_at: null }
    });
    if (!classData) throw { status: 404, message: 'Mã lớp không tồn tại hoặc đã hết hiệu lực' };

    const existing = await prisma.classMember.findUnique({
      where: { class_id_student_id: { class_id: classData.id, student_id: studentId } }
    });
    
    if (existing && existing.is_active) {
      throw { status: 409, message: 'Bạn đã là thành viên của lớp này' };
    }

    if (existing && !existing.is_active) {
      return prisma.classMember.update({
        where: { id: existing.id },
        data: { is_active: true, joined_at: new Date() }
      });
    }

    return prisma.classMember.create({
      data: {
        class_id: classData.id,
        student_id: studentId
      }
    });
  }

  static async getMyClasses(studentId: string) {
    return prisma.classMember.findMany({
      where: { student_id: studentId, is_active: true },
      include: {
        class: {
          include: { teacher: { select: { full_name: true } } }
        }
      }
    });
  }
}

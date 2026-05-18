import { prisma } from '../../lib/prisma';
export class ClassesService {
  static async createClass(data: any, teacherId: string) {
    return prisma.class.create({
      data: { ...data, teacher_id: teacherId }
    });
  }
}

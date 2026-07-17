import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AiRepository {
  async saveStudentReport(studentId: string, report: any): Promise<void> {
    await prisma.aiReport.create({
      data: {
        student_id: studentId,
        type: 'student',
        report,
      }
    });
  }

  async saveClassReport(classId: string, report: any): Promise<void> {
    await prisma.aiReport.create({
      data: {
        class_id: classId,
        type: 'class',
        report,
      }
    });
  }

  async getLatestStudentReport(studentId: string) {
    return prisma.aiReport.findFirst({
      where: {
        student_id: studentId,
        type: 'student',
      },
      orderBy: {
        created_at: 'desc',
      }
    });
  }

  async getLatestClassReport(classId: string) {
    return prisma.aiReport.findFirst({
      where: {
        class_id: classId,
        type: 'class',
      },
      orderBy: {
        created_at: 'desc',
      }
    });
  }
}

import { PrismaClient, Prisma } from '@prisma/client';

export class CurriculumsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findClassById(classId: string) {
    return this.prisma.class.findUnique({
      where: { id: classId, deleted_at: null }
    });
  }

  async checkStudentMembership(classId: string, studentId: string) {
    return this.prisma.classMember.findUnique({
      where: { class_id_student_id: { class_id: classId, student_id: studentId } }
    });
  }

  async findMaxOrderIndex(classId: string): Promise<number> {
    const item = await this.prisma.classCurriculum.findFirst({
      where: { class_id: classId, deleted_at: null },
      orderBy: { order_index: 'desc' },
      select: { order_index: true }
    });
    return item ? item.order_index : -1;
  }

  async createCurriculum(data: {
    class_id: string;
    title: string;
    content_html: string;
    video_url?: string | null;
    video_type?: string | null;
    order_index: number;
    is_published?: boolean;
    materials?: {
      title: string;
      file_url: string;
      file_type?: string | null;
      file_size?: number | null;
      order_index?: number;
    }[];
    assignment_ids?: string[];
  }) {
    const { materials, assignment_ids, ...curriculumData } = data;

    return this.prisma.classCurriculum.create({
      data: {
        ...curriculumData,
        materials: materials && materials.length > 0 ? {
          create: materials.map((m, idx) => ({
            title: m.title,
            file_url: m.file_url,
            file_type: m.file_type || null,
            file_size: m.file_size || null,
            order_index: m.order_index ?? idx
          }))
        } : undefined,
        assignments: assignment_ids && assignment_ids.length > 0 ? {
          create: assignment_ids.map((aId, idx) => ({
            assignment_id: aId,
            order_index: idx
          }))
        } : undefined
      },
      include: {
        materials: { orderBy: { order_index: 'asc' } },
        assignments: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                mode: true,
                deadline: true,
                max_attempts: true,
                time_limit: true,
                is_published: true,
                _count: { select: { assignment_questions: true } }
              }
            }
          },
          orderBy: { order_index: 'asc' }
        }
      }
    });
  }

  async findCurriculumsByClassId(classId: string, isTeacher: boolean = false) {
    return this.prisma.classCurriculum.findMany({
      where: {
        class_id: classId,
        deleted_at: null,
        ...(!isTeacher ? { is_published: true } : {})
      },
      include: {
        materials: {
          orderBy: { order_index: 'asc' }
        },
        assignments: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                mode: true,
                deadline: true,
                max_attempts: true,
                time_limit: true,
                is_published: true,
                _count: { select: { assignment_questions: true } }
              }
            }
          },
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { order_index: 'asc' }
    });
  }

  async findCurriculumById(id: string) {
    return this.prisma.classCurriculum.findUnique({
      where: { id, deleted_at: null },
      include: {
        class: {
          select: {
            id: true,
            teacher_id: true,
            name: true
          }
        },
        materials: {
          orderBy: { order_index: 'asc' }
        },
        assignments: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                mode: true,
                deadline: true,
                max_attempts: true,
                time_limit: true,
                is_published: true,
                _count: { select: { assignment_questions: true } }
              }
            }
          },
          orderBy: { order_index: 'asc' }
        }
      }
    });
  }

  async updateCurriculum(
    id: string,
    data: {
      title?: string;
      content_html?: string;
      video_url?: string | null;
      video_type?: string | null;
      is_published?: boolean;
      materials?: {
        title: string;
        file_url: string;
        file_type?: string | null;
        file_size?: number | null;
        order_index?: number;
      }[];
      assignment_ids?: string[];
    }
  ) {
    const { materials, assignment_ids, ...fieldsToUpdate } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin chính của Curriculum
      await tx.classCurriculum.update({
        where: { id },
        data: fieldsToUpdate
      });

      // 2. Nếu có truyền materials mới -> thay thế danh sách cũ
      if (materials !== undefined) {
        await tx.curriculumMaterial.deleteMany({
          where: { curriculum_id: id }
        });

        if (materials.length > 0) {
          await tx.curriculumMaterial.createMany({
            data: materials.map((m, idx) => ({
              curriculum_id: id,
              title: m.title,
              file_url: m.file_url,
              file_type: m.file_type || null,
              file_size: m.file_size || null,
              order_index: m.order_index ?? idx
            }))
          });
        }
      }

      // 3. Nếu có truyền assignment_ids mới -> thay thế liên kết cũ
      if (assignment_ids !== undefined) {
        await tx.curriculumAssignment.deleteMany({
          where: { curriculum_id: id }
        });

        if (assignment_ids.length > 0) {
          await tx.curriculumAssignment.createMany({
            data: assignment_ids.map((aId, idx) => ({
              curriculum_id: id,
              assignment_id: aId,
              order_index: idx
            }))
          });
        }
      }

      // 4. Trả về kết quả mới nhất
      return tx.classCurriculum.findUnique({
        where: { id },
        include: {
          materials: { orderBy: { order_index: 'asc' } },
          assignments: {
            include: {
              assignment: {
                select: {
                  id: true,
                  title: true,
                  mode: true,
                  deadline: true,
                  max_attempts: true,
                  time_limit: true,
                  is_published: true,
                  _count: { select: { assignment_questions: true } }
                }
              }
            },
            orderBy: { order_index: 'asc' }
          }
        }
      });
    });
  }

  async deleteCurriculum(id: string) {
    return this.prisma.classCurriculum.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
  }

  async reorderCurriculums(classId: string, orders: { id: string; order_index: number }[]) {
    return this.prisma.$transaction(
      orders.map((item) =>
        this.prisma.classCurriculum.update({
          where: { id: item.id, class_id: classId },
          data: { order_index: item.order_index }
        })
      )
    );
  }
}

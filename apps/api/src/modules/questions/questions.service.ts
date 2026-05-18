import { prisma } from '../../lib/prisma';
export class QuestionsService {
  static async createQuestion(data: any, teacherId: string) {
    return prisma.question.create({
      data: {
        content: data.content,
        question_type: data.question_type,
        topic: data.topic,
        created_by: teacherId,
        answer_options: {
          create: data.options.map((opt: any, index: number) => ({
            content: opt.content,
            is_correct: opt.is_correct,
            order_index: index
          }))
        }
      },
      include: { answer_options: true }
    });
  }
}

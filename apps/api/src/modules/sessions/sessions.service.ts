import { prisma } from '../../lib/prisma';

export class SessionsService {
  static async startSession(studentId: string, assignmentId: string) {
    // Simplified logic: just grab questions linked to assignment
    const assignmentQuestions = await prisma.assignmentQuestion.findMany({
      where: { assignment_id: assignmentId },
      include: { question: { include: { answer_options: true } } }
    });

    const session = await prisma.quizSession.create({
      data: {
        student_id: studentId,
        assignment_id: assignmentId,
        total_q: assignmentQuestions.length,
        status: 'in_progress'
      }
    });

    return { session, questions: assignmentQuestions.map(aq => aq.question) };
  }
}

import { PrismaClient, Prisma } from '@prisma/client';

export class SessionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllTopics() {
    return this.prisma.topic.findMany();
  }

  async findAssignmentById(id: string) {
    return this.prisma.assignment.findUnique({
      where: { id, deleted_at: null },
      include: { class: true }
    });
  }

  async countCompletedSessions(studentId: string, assignmentId: string) {
    return this.prisma.quizSession.count({
      where: { student_id: studentId, assignment_id: assignmentId, status: 'completed' }
    });
  }

  async findAssignmentQuestions(assignmentId: string) {
    return this.prisma.assignmentQuestion.findMany({
      where: { assignment_id: assignmentId },
      include: { question: true },
      orderBy: { order_index: 'asc' }
    });
  }

  async findAnswerOptionsByQuestionId(questionId: string) {
    return this.prisma.answerOption.findMany({
      where: { question_id: questionId },
      select: { id: true, content: true, order_index: true, is_correct: true }
    });
  }

  async createQuizSession(data: Prisma.QuizSessionUncheckedCreateInput) {
    return this.prisma.quizSession.create({ data });
  }

  async findQuizSessionById(id: string, includeRelations?: boolean) {
    const query: any = { where: { id } };
    if (includeRelations) {
      query.include = { assignment: true };
    }
    return this.prisma.quizSession.findUnique(query);
  }

  async findQuizSessionWithAnswers(id: string) {
    return this.prisma.quizSession.findUnique({
      where: { id },
      include: { session_answers: { include: { question: { include: { topic: true, answer_options: true } } } } }
    });
  }

  async findSM2Progress(studentId: string, questionId: string) {
    return this.prisma.sm2Progress.findUnique({
      where: { student_id_question_id: { student_id: studentId, question_id: questionId } }
    });
  }

  async createSessionAnswer(data: Prisma.SessionAnswerUncheckedCreateInput) {
    return this.prisma.sessionAnswer.create({ data });
  }

  async upsertSM2Progress(where: Prisma.Sm2ProgressWhereUniqueInput, create: Prisma.Sm2ProgressUncheckedCreateInput, update: Prisma.Sm2ProgressUncheckedUpdateInput) {
    return this.prisma.sm2Progress.upsert({ where, create, update });
  }

  async updateQuizSession(id: string, data: Prisma.QuizSessionUncheckedUpdateInput) {
    return this.prisma.quizSession.update({
      where: { id },
      data
    });
  }
}

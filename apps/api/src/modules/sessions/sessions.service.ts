import { prisma } from '../../lib/prisma';
import { updateSM2 } from '@adaptive-lang/sm2-engine';

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

    return { session, questions: assignmentQuestions.map((aq: any) => aq.question) };
  }

  static async submitAnswer(studentId: string, sessionId: string, data: any) {
    const { questionId, selectedOptionId, responseTimeMs } = data;

    // Check if correct
    const option = await prisma.answerOption.findUnique({ where: { id: selectedOptionId } });
    const isCorrect = option?.is_correct || false;

    // Fetch existing progress
    const progress = await prisma.sm2Progress.findUnique({
      where: { student_id_question_id: { student_id: studentId, question_id: questionId } }
    });

    // Run SM2 Algorithm
    const sm2Result = updateSM2({
      progress: progress ? {
        easiness_factor: Number(progress.easiness_factor),
        interval_days: progress.interval_days,
        repetition_count: progress.repetition_count
      } : null,
      is_correct: isCorrect,
      response_time_ms: responseTimeMs
    });

    // Save Answer
    const answer = await prisma.sessionAnswer.create({
      data: {
        session_id: sessionId,
        question_id: questionId,
        selected_option: selectedOptionId,
        is_correct: isCorrect,
        response_time_ms: responseTimeMs,
        sm2_quality: sm2Result.q
      }
    });

    // Upsert SM2 Progress
    await prisma.sm2Progress.upsert({
      where: { student_id_question_id: { student_id: studentId, question_id: questionId } },
      create: {
        student_id: studentId,
        question_id: questionId,
        easiness_factor: sm2Result.new_ef,
        interval_days: sm2Result.new_interval,
        repetition_count: sm2Result.new_repetition_count,
        next_review_date: sm2Result.next_review_date,
        total_attempts: 1,
        correct_attempts: isCorrect ? 1 : 0
      },
      update: {
        easiness_factor: sm2Result.new_ef,
        interval_days: sm2Result.new_interval,
        repetition_count: sm2Result.new_repetition_count,
        next_review_date: sm2Result.next_review_date,
        total_attempts: { increment: 1 },
        correct_attempts: isCorrect ? { increment: 1 } : undefined,
        last_reviewed_at: new Date()
      }
    });

    return { isCorrect, sm2Result, answer };
  }
}

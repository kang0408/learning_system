import { prisma } from '../../lib/prisma';
import { updateSM2 } from '@adaptive-lang/sm2-engine';

// Mock Redis Cache
const sessionCache = new Map<string, any>();

export class SessionsService {
  static async startSession(studentId: string, assignmentId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId, deleted_at: null },
      include: { class: true }
    });
    if (!assignment || !assignment.is_published) throw { status: 404, message: 'Assignment not found or not published' };

    // Check attempts
    if (assignment.max_attempts > 0) {
      const attempts = await prisma.quizSession.count({
        where: { student_id: studentId, assignment_id: assignmentId, status: 'completed' }
      });
      if (attempts >= assignment.max_attempts) throw { status: 403, message: 'Max attempts reached' };
    }

    let questionsList: any[] = [];

    if (assignment.mode === 'adaptive') {
      // Phan 2 Query 1: SM-2 Due Questions
      const dueQuestions: any[] = await prisma.$queryRaw`
        SELECT q.id, q.content, q.question_type, q.topic, q.difficulty,
               sp.easiness_factor, sp.repetition_count, sp.next_review_date
        FROM sm2_progress sp
        JOIN questions q ON q.id = sp.question_id
        JOIN assignment_questions aq ON aq.question_id = q.id
        WHERE sp.student_id = ${studentId}::uuid
          AND aq.assignment_id = ${assignmentId}::uuid
          AND sp.next_review_date <= CURRENT_DATE
          AND q.deleted_at IS NULL
        ORDER BY sp.next_review_date ASC, sp.easiness_factor ASC
        LIMIT 20;
      `;

      // Get assignment questions missing from progress (new questions)
      const newQuestions: any[] = await prisma.$queryRaw`
        SELECT q.id, q.content, q.question_type, q.topic, q.difficulty
        FROM assignment_questions aq
        JOIN questions q ON q.id = aq.question_id
        LEFT JOIN sm2_progress sp ON sp.question_id = q.id AND sp.student_id = ${studentId}::uuid
        WHERE aq.assignment_id = ${assignmentId}::uuid
          AND sp.id IS NULL
          AND q.deleted_at IS NULL
        LIMIT ${20 - dueQuestions.length};
      `;
      
      questionsList = [...dueQuestions, ...newQuestions];
      
    } else {
      // Fixed mode
      const aqs = await prisma.assignmentQuestion.findMany({
        where: { assignment_id: assignmentId },
        include: { question: true },
        orderBy: { order_index: 'asc' }
      });
      questionsList = aqs.map(aq => aq.question).filter(q => !q.deleted_at);
    }

    if (questionsList.length === 0) throw { status: 400, message: 'No questions available' };

    // Fetch answer options for questions to send to client
    for (const q of questionsList) {
      const opts = await prisma.answerOption.findMany({
        where: { question_id: q.id },
        select: { id: true, content: true, order_index: true } // Exclude is_correct for security
      });
      q.answer_options = opts;
    }

    const session = await prisma.quizSession.create({
      data: {
        student_id: studentId,
        assignment_id: assignmentId,
        total_q: questionsList.length,
        status: 'in_progress'
      }
    });

    sessionCache.set(session.id, {
      questions: questionsList,
      currentIndex: 0,
      total: questionsList.length
    });

    return {
      session_id: session.id,
      assignment_title: assignment.title,
      total_questions: questionsList.length,
      time_limit_seconds: assignment.time_limit ? assignment.time_limit * 60 : null,
      started_at: session.started_at,
      first_question: { ...questionsList[0], question_index: 1 }
    };
  }

  static async submitAnswer(studentId: string, sessionId: string, data: any) {
    const { question_id, selected_option_id, response_time_ms } = data;

    const cacheState = sessionCache.get(sessionId);
    if (!cacheState) throw { status: 404, message: 'Session expired or not found in cache' };

    const session = await prisma.quizSession.findUnique({ where: { id: sessionId } });
    if (!session || session.status !== 'in_progress') throw { status: 400, message: 'Session not active' };

    // Check correct answer
    const options = await prisma.answerOption.findMany({ where: { question_id } });
    const correctOpt = options.find(o => o.is_correct);
    const isCorrect = correctOpt ? correctOpt.id === selected_option_id : false;

    // Calc SM-2 Quality
    let sm2Quality = 0;
    if (isCorrect) {
      if (response_time_ms < 5000) sm2Quality = 5;
      else if (response_time_ms <= 15000) sm2Quality = 4;
      else sm2Quality = 3;
    } else if (selected_option_id) {
      sm2Quality = 1; // Wrong option chosen
    } else {
      sm2Quality = 0; // Timeout / No answer
    }

    // Fetch existing progress
    const progress = await prisma.sm2Progress.findUnique({
      where: { student_id_question_id: { student_id: studentId, question_id } }
    });

    // Run SM2 Algorithm
    const sm2Result = updateSM2({
      progress: progress ? {
        easiness_factor: Number(progress.easiness_factor),
        interval_days: progress.interval_days,
        repetition_count: progress.repetition_count
      } : null,
      is_correct: isCorrect,
      response_time_ms: response_time_ms
    });

    // Save Answer
    await prisma.sessionAnswer.create({
      data: {
        session_id: sessionId,
        question_id,
        selected_option: selected_option_id,
        is_correct: isCorrect,
        response_time_ms,
        sm2_quality: sm2Quality
      }
    });

    // Upsert SM2 Progress
    await prisma.sm2Progress.upsert({
      where: { student_id_question_id: { student_id: studentId, question_id } },
      create: {
        student_id: studentId,
        question_id,
        easiness_factor: sm2Result.new_ef,
        interval_days: sm2Result.new_interval,
        repetition_count: sm2Result.new_repetition_count,
        next_review_date: new Date(sm2Result.next_review_date),
        total_attempts: 1,
        correct_attempts: isCorrect ? 1 : 0
      },
      update: {
        easiness_factor: sm2Result.new_ef,
        interval_days: sm2Result.new_interval,
        repetition_count: sm2Result.new_repetition_count,
        next_review_date: new Date(sm2Result.next_review_date),
        total_attempts: { increment: 1 },
        correct_attempts: isCorrect ? { increment: 1 } : undefined,
        last_reviewed_at: new Date()
      }
    });

    // Update Session Counters
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        correct_q: isCorrect ? { increment: 1 } : undefined
      }
    });

    cacheState.currentIndex++;
    let nextQuestion = null;
    if (cacheState.currentIndex < cacheState.total) {
      nextQuestion = { ...cacheState.questions[cacheState.currentIndex], question_index: cacheState.currentIndex + 1 };
    }

    return {
      is_correct: isCorrect,
      correct_option_id: correctOpt?.id,
      sm2_quality: sm2Quality,
      next_review_in_days: sm2Result.new_interval,
      next_question: nextQuestion,
      session_progress: {
        answered: cacheState.currentIndex,
        total: cacheState.total,
        correct_so_far: session.correct_q + (isCorrect ? 1 : 0)
      }
    };
  }

  static async finishSession(studentId: string, sessionId: string) {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: { session_answers: { include: { question: true } } }
    });
    if (!session || session.student_id !== studentId) throw { status: 404, message: 'Session not found' };

    const score = session.total_q > 0 ? (session.correct_q / session.total_q) * 100 : 0;
    const finishedAt = new Date();
    const durationSeconds = Math.floor((finishedAt.getTime() - session.started_at.getTime()) / 1000);

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { status: 'completed', finished_at: finishedAt, score }
    });

    sessionCache.delete(sessionId);

    // Topic performance logic
    const topicStats: Record<string, { total: number, correct: number }> = {};
    for (const ans of session.session_answers) {
      const topic = ans.question.topic || 'General';
      if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
      topicStats[topic].total++;
      if (ans.is_correct) topicStats[topic].correct++;
    }

    const performance_by_topic = Object.entries(topicStats).map(([topic, stat]) => ({
      topic,
      accuracy: (stat.correct / stat.total) * 100
    }));

    const weakestTopic = performance_by_topic.sort((a, b) => a.accuracy - b.accuracy)[0]?.topic || null;

    return {
      session_id: sessionId,
      score,
      total_questions: session.total_q,
      correct_questions: session.correct_q,
      duration_seconds: durationSeconds,
      finished_at: finishedAt,
      performance_by_topic,
      weakest_topic: weakestTopic
    };
  }

  static async abandonSession(studentId: string, sessionId: string) {
    const session = await prisma.quizSession.findUnique({ where: { id: sessionId } });
    if (!session || session.student_id !== studentId) throw { status: 404, message: 'Session not found' };

    sessionCache.delete(sessionId);

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { status: 'abandoned', finished_at: new Date() }
    });
  }

  static async getSessionInfo(studentId: string, sessionId: string) {
    const session = await prisma.quizSession.findUnique({ where: { id: sessionId } });
    if (!session || session.student_id !== studentId) throw { status: 404, message: 'Session not found' };
    
    return {
      status: session.status,
      total_q: session.total_q,
      correct_q: session.correct_q,
      score: session.score,
      started_at: session.started_at,
      finished_at: session.finished_at
    };
  }
}

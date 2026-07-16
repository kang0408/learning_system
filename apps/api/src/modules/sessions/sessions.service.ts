import { prisma } from '../../lib/prisma';
import { updateSM2 } from '@adaptive-lang/sm2-engine';
import redisClient from '../../lib/redis';
import { SM2Repository } from '../sm2/sm2.repository';

export class SessionsService {
  private static computeTopicPerformance(answers: any[]) {
    const topicStats: Record<string, { total: number, correct: number }> = {};
    for (const ans of answers) {
      const topicName = (ans.question as any).topic?.name || 'General';
      if (!topicStats[topicName]) topicStats[topicName] = { total: 0, correct: 0 };
      topicStats[topicName].total++;
      if (ans.is_correct) topicStats[topicName].correct++;
    }

    const performance_by_topic = Object.entries(topicStats).map(([topic, stat]) => ({
      topic,
      accuracy: (stat.correct / stat.total) * 100
    }));

    const weakestTopic = performance_by_topic.length > 0 
      ? performance_by_topic.sort((a, b) => a.accuracy - b.accuracy)[0].topic 
      : null;

    return { performance_by_topic, weakestTopic };
  }

  static async startSession(studentId: string, assignmentId: string) {
    try {
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId, deleted_at: null },
        include: { class: true }
      });
      if (!assignment || !assignment.is_published) throw { status: 404, message: 'Assignment not found or not published' };

      // Check attempts
      if (assignment.max_attempts > 0 && assignment.mode !== 'adaptive') {
        const attempts = await prisma.quizSession.count({
          where: { student_id: studentId, assignment_id: assignmentId, status: 'completed' }
        });
        if (attempts >= assignment.max_attempts) throw { status: 403, message: 'Max attempts reached' };
      }

      let questionsList: any[] = [];

      if (assignment.mode === 'adaptive') {
        try {
          const dueQuestions = await SM2Repository.getDueQuestions(studentId, assignmentId, 20);
          const newQuestions = await SM2Repository.getNewQuestions(studentId, assignmentId, 20 - dueQuestions.length);
          
          questionsList = [...dueQuestions, ...newQuestions];
          
          // Fallback: If no questions are due and no new questions exist, fetch some for early review
          if (questionsList.length === 0) {
            questionsList = await SM2Repository.getEarlyReviewQuestions(studentId, assignmentId);
          }
        } catch (error) {
          // Fail-safe SM-2 Engine (Mục 1.5.4): Fallback về chế độ quiz ngẫu nhiên nếu engine lỗi
          console.error('[SM2 Fallback] Lỗi quá trình tính toán SM-2, chuyển sang ngẫu nhiên:', error);
          const aqs = await prisma.assignmentQuestion.findMany({
            where: { assignment_id: assignmentId },
            include: { question: true }
          });
          questionsList = aqs.map(aq => aq.question)
                             .filter(q => !q.deleted_at)
                             .sort(() => 0.5 - Math.random()) // Trộn ngẫu nhiên
                             .slice(0, 20); // Lấy tối đa 20 câu giống adaptive
        }
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
        if (q.question_type === 'fill_blank') {
          q.answer_options = []; // Hide answer options for fill-in-the-blank to prevent cheating
        } else {
          const opts = await prisma.answerOption.findMany({
            where: { question_id: q.id },
            select: { id: true, content: true, order_index: true } // Exclude is_correct for security
          });
          q.answer_options = opts;
        }
      }

      const session = await prisma.quizSession.create({
        data: {
          student_id: studentId,
          assignment_id: assignmentId,
          total_q: questionsList.length,
          status: 'in_progress'
        }
      });

      const ttl = assignment.time_limit ? (assignment.time_limit * 60) + 600 : 86400; // time limit + 10 mins, or 24 hours
      await redisClient.setEx(`session:${session.id}`, ttl, JSON.stringify({
        questions: questionsList,
        currentIndex: 0,
        total: questionsList.length
      }));

      return {
        session_id: session.id,
        assignment_title: assignment.title,
        total_questions: questionsList.length,
        time_limit_seconds: assignment.time_limit ? assignment.time_limit * 60 : null,
        started_at: session.started_at,
        questions: questionsList,
        first_question: { ...questionsList[0], question_index: 1 }
      };
    } catch (error: any) {
      if (error.status) throw error;
      throw { status: 500, message: error.message || 'Internal server error' };
    }
  }

  static async submitAnswer(studentId: string, sessionId: string, data: any) {
    try {
      const { question_id, selected_option_id, response_time_ms } = data;

      const cacheStr = await redisClient.get(`session:${sessionId}`);
      if (!cacheStr) throw { status: 404, message: 'Session expired or not found in cache' };
      const cacheState = JSON.parse(cacheStr);

      const session = await prisma.quizSession.findUnique({ 
        where: { id: sessionId },
        include: { assignment: true }
      });
      if (!session || session.status !== 'in_progress') throw { status: 400, message: 'Session not active' };

      // [Best Practice Security]: Kiểm tra tính hợp lệ của thời gian làm bài (Anti-cheat bypass time limit)
      if (session.assignment && session.assignment.time_limit) {
        const elapsedMs = Date.now() - session.started_at.getTime();
        const limitMs = session.assignment.time_limit * 60 * 1000;
        // Cho phép trễ 15 giây (grace period) để đền bù mạng lag
        if (elapsedMs > limitMs + 15000) {
          // Bắt buộc nộp bài nếu cố tình trả lời khi quá giờ
          await this.finishSession(studentId, sessionId);
          throw { status: 403, message: 'Đã hết thời gian làm bài. Hệ thống từ chối nhận thêm câu trả lời.' };
        }
      }

      // Get question difficulty from cache
      const currentQuestion = cacheState.questions.find((q: any) => q.id === question_id);
      const difficulty = currentQuestion?.difficulty || 3;

      // Check correct answer
      const options = await prisma.answerOption.findMany({ where: { question_id } });
      const correctOpt = options.find(o => o.is_correct);
      
      let isCorrect = false;
      if (data.fill_text !== undefined) {
        isCorrect = correctOpt ? correctOpt.content.trim().toLowerCase() === data.fill_text.trim().toLowerCase() : false;
      } else {
        isCorrect = correctOpt ? correctOpt.id === selected_option_id : false;
      }

      // Fetch existing progress
      const progress = await prisma.sm2Progress.findUnique({
        where: { student_id_question_id: { student_id: studentId, question_id } }
      });

      // Run SM2 Algorithm
      let sm2Result = null;
      try {
        sm2Result = updateSM2({
          progress: progress ? {
            easiness_factor: Number(progress.easiness_factor),
            interval_days: progress.interval_days,
            repetition_count: progress.repetition_count
          } : null,
          is_correct: isCorrect,
          response_time_ms: response_time_ms,
          difficulty: difficulty,
          question_type: currentQuestion?.question_type || currentQuestion?.type
        });
      } catch (e) {
        // [Best Practice Observability]: Trong thực tế sẽ gửi alert qua Telegram/Slack/Sentry
        console.error('🚨 [CRITICAL SM2 FALLBACK] Lỗi tính toán SM-2:', e);
      }

      // Save Answer (Luôn luôn lưu lịch sử làm bài để tính điểm)
      await prisma.sessionAnswer.create({
        data: {
          session_id: sessionId,
          question_id,
          selected_option: selected_option_id || null,
          text_answer: data.fill_text || null,
          is_correct: isCorrect,
          response_time_ms,
          // Đánh dấu sm2_quality = -1 (hoặc null) để biết câu này bị lỗi thuật toán
          sm2_quality: sm2Result ? sm2Result.q : -1 
        }
      });

      // [Best Practice Data Integrity]: CHỈ cập nhật SM-2 nếu thuật toán chạy thành công
      if (sm2Result) {
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
      }

      // Update Session Counters
      await prisma.quizSession.update({
        where: { id: sessionId },
        data: {
          answered_q: { increment: 1 },
          correct_q: isCorrect ? { increment: 1 } : undefined
        }
      });

      cacheState.currentIndex++;
      let nextQuestion = null;
      if (cacheState.currentIndex < cacheState.total) {
        nextQuestion = { ...cacheState.questions[cacheState.currentIndex], question_index: cacheState.currentIndex + 1 };
      }

      // Update cache
      const ttl = await redisClient.ttl(`session:${sessionId}`);
      if (ttl > 0) {
        await redisClient.setEx(`session:${sessionId}`, ttl, JSON.stringify(cacheState));
      }

      return {
        is_correct: isCorrect,
        correct_option_id: correctOpt?.id,
        explanation: currentQuestion?.explanation || null,
        sm2_quality: sm2Result ? sm2Result.q : -1,
        next_review_in_days: sm2Result ? sm2Result.new_interval : (progress ? progress.interval_days : 1),
        next_question: nextQuestion,
        session_progress: {
          answered: cacheState.currentIndex,
          total: cacheState.total,
          correct_so_far: session.correct_q + (isCorrect ? 1 : 0)
        }
      };
    } catch (error: any) {
      if (error.status) throw error;
      throw { status: 500, message: error.message || 'Internal server error' };
    }
  }

  static async finishSession(studentId: string, sessionId: string) {
    try {
      const session = await prisma.quizSession.findUnique({
        where: { id: sessionId },
        include: { session_answers: { include: { question: { include: { topic: true } } } } }
      });
      if (!session || session.student_id !== studentId) throw { status: 404, message: 'Session not found' };

      const score = session.answered_q > 0 ? (session.correct_q / session.answered_q) * 100 : 0;
      const finishedAt = new Date();
      const durationSeconds = Math.floor((finishedAt.getTime() - session.started_at.getTime()) / 1000);

      await prisma.quizSession.update({
        where: { id: sessionId },
        data: { status: 'completed', finished_at: finishedAt, score }
      });

      await redisClient.del(`session:${sessionId}`);

      // Topic performance logic
      const { performance_by_topic, weakestTopic } = this.computeTopicPerformance(session.session_answers);

      return {
        session_id: sessionId,
        score,
        total_questions: session.total_q,
        answered_questions: session.answered_q,
        correct_questions: session.correct_q,
        duration_seconds: durationSeconds,
        finished_at: finishedAt,
        performance_by_topic,
        weakest_topic: weakestTopic
      };
    } catch (error: any) {
      if (error.status) throw error;
      throw { status: 500, message: error.message || 'Internal server error' };
    }
  }

  static async abandonSession(studentId: string, sessionId: string) {
    try {
      const session = await prisma.quizSession.findUnique({ where: { id: sessionId } });
      if (!session || session.student_id !== studentId) throw { status: 404, message: 'Session not found' };

      await redisClient.del(`session:${sessionId}`);

      await prisma.quizSession.update({
        where: { id: sessionId },
        data: { status: 'abandoned', finished_at: new Date() }
      });
    } catch (error: any) {
      if (error.status) throw error;
      throw { status: 500, message: error.message || 'Internal server error' };
    }
  }

  static async getSessionInfo(studentId: string, sessionId: string) {
    try {
      const session = await prisma.quizSession.findUnique({ where: { id: sessionId } });
      if (!session || session.student_id !== studentId) throw { status: 404, message: 'Session not found' };
      
      return {
        status: session.status,
        total_q: session.total_q,
        answered_q: session.answered_q,
        correct_q: session.correct_q,
        score: session.score,
        started_at: session.started_at,
        finished_at: session.finished_at
      };
    } catch (error: any) {
      if (error.status) throw error;
      throw { status: 500, message: error.message || 'Internal server error' };
    }
  }

  static async getSessionResult(studentId: string, sessionId: string) {
    try {
      const session = await prisma.quizSession.findUnique({
        where: { id: sessionId },
        include: { session_answers: { include: { question: { include: { topic: true, answer_options: true } } } } }
      });
      if (!session || session.student_id !== studentId) throw { status: 404, message: 'Session not found' };
      if (session.status !== 'completed') throw { status: 400, message: 'Session is not completed yet' };

      const score = session.score || 0;
      const durationSeconds = session.finished_at ? Math.floor((session.finished_at.getTime() - session.started_at.getTime()) / 1000) : 0;

      // Topic performance logic
      const { performance_by_topic, weakestTopic } = this.computeTopicPerformance(session.session_answers);

      return {
        session_id: sessionId,
        score,
        total_questions: session.total_q,
        answered_questions: session.answered_q,
        correct_questions: session.correct_q,
        duration_seconds: durationSeconds,
        finished_at: session.finished_at,
        performance_by_topic,
        weakest_topic: weakestTopic,
        session_answers: session.session_answers
      };
    } catch (error: any) {
      if (error.status) throw error;
      throw { status: 500, message: error.message || 'Internal server error' };
    }
  }
}

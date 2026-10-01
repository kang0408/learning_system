import { updateSM2 } from '@learning-system/sm2-engine';
import redisClient from '../../lib/redis';
import { SM2Repository } from '../sm2/sm2.repository';
import { ApiError } from '../../lib/ApiError';
import { SessionsRepository } from './sessions.repository';

export class SessionsService {
  private sessionStateMap = new Map<string, {
    questions: any[];
    currentIndex: number;
    total: number;
    session_mode: string;
  }>();

  constructor(
    private readonly sessionsRepository: SessionsRepository, 
    private readonly sm2Repository: SM2Repository
  ) {}

  private async computeTopicPerformance(answers: any[]) {
    const topicStats: Record<string, { total: number, correct: number }> = {};
    const topics = await this.sessionsRepository.findAllTopics();
    const topicMap = new Map<string, any>();
    for (const t of topics) topicMap.set(t.id, t);

    for (const ans of answers) {
      let topicPath = 'General';
      const topic = (ans.question as any).topic;
      if (topic) {
        let curr = topicMap.get(topic.id);
        const pathParts = [];
        while (curr) {
          pathParts.unshift(curr.name);
          curr = curr.parent_id ? topicMap.get(curr.parent_id) : null;
        }
        topicPath = pathParts.length > 0 ? pathParts.join(' ➔ ') : topic.name;
      }
      
      if (!topicStats[topicPath]) topicStats[topicPath] = { total: 0, correct: 0 };
      topicStats[topicPath].total++;
      if (ans.is_correct) topicStats[topicPath].correct++;
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

  async startSession(studentId: string, assignmentId: string, mode?: 'standard' | 'review', topicId?: string) {
    // Automatically abandon any stale/unfinished in_progress sessions for this student & assignment
    const staleIds = await this.sessionsRepository.abandonStaleSessions(studentId, assignmentId);
    if (redisClient.isOpen && staleIds.length > 0) {
      for (const sId of staleIds) {
        await redisClient.del(`session:${sId}`).catch(() => {});
      }
    }

    const assignment = await this.sessionsRepository.findAssignmentById(assignmentId);
    if (!assignment || !assignment.is_published) throw new ApiError(404, 'Assignment not found or not published');

    // Check attempts (skip attempt check for SM-2 review mode)
    if (assignment.max_attempts > 0 && assignment.mode !== 'adaptive' && mode !== 'review') {
      const attempts = await this.sessionsRepository.countCompletedSessions(studentId, assignmentId);
      if (attempts >= assignment.max_attempts) throw new ApiError(403, 'Max attempts reached');
    }

    let questionsList: any[] = [];

    if (topicId) {
      // Khi học sinh chủ động bấm luyện tập / củng cố theo chủ đề (Weak topic drill)
      questionsList = await this.sm2Repository.getTopicPracticeQuestions(studentId, topicId, assignmentId, 20);

      // Dự phòng nếu không tìm thấy câu hỏi từ lớp học qua CTE
      if (questionsList.length === 0) {
        const aqs = await this.sessionsRepository.findAssignmentQuestions(assignmentId);
        questionsList = aqs.map(aq => aq.question).filter(q => !q.deleted_at && q.topic_id === topicId);
      }
    } else if (mode === 'review') {
      // In SM2 review mode: specifically fetch questions due for review in this assignment
      const dueQuestions = await this.sm2Repository.getDueQuestions(studentId, assignmentId, 20);
      if (dueQuestions.length > 0) {
        questionsList = dueQuestions;
      } else {
        // Fallback: If no questions due right now, fetch early review questions
        questionsList = await this.sm2Repository.getEarlyReviewQuestions(studentId, assignmentId);
      }

      // Fallback: If still empty, use all questions of assignment
      if (questionsList.length === 0) {
        const aqs = await this.sessionsRepository.findAssignmentQuestions(assignmentId);
        questionsList = aqs.map(aq => aq.question).filter(q => !q.deleted_at);
      }
    } else if (assignment.mode === 'adaptive') {
      try {
        const dueQuestions = await this.sm2Repository.getDueQuestions(studentId, assignmentId, 20);
        const newQuestions = await this.sm2Repository.getNewQuestions(studentId, assignmentId, 20 - dueQuestions.length);
        
        questionsList = [...dueQuestions, ...newQuestions];
        
        // Fallback: If no questions are due and no new questions exist, fetch some for early review
        if (questionsList.length === 0) {
          questionsList = await this.sm2Repository.getEarlyReviewQuestions(studentId, assignmentId);
        }
      } catch (error) {
        console.error('[SM2 Fallback] Lỗi quá trình tính toán SM-2, chuyển sang ngẫu nhiên:', error);
        const aqs = await this.sessionsRepository.findAssignmentQuestions(assignmentId);
        questionsList = aqs.map(aq => aq.question)
                            .filter(q => !q.deleted_at)
                            .sort(() => 0.5 - Math.random()) // Trộn ngẫu nhiên
                            .slice(0, 20); // Lấy tối đa 20 câu giống adaptive
      }
    } else {
      // Fixed mode
      const aqs = await this.sessionsRepository.findAssignmentQuestions(assignmentId);
      questionsList = aqs.map(aq => aq.question).filter(q => !q.deleted_at);
    }

    if (questionsList.length === 0) throw new ApiError(400, 'No questions available');

    // Fetch answer options for questions to send to client
    for (const q of questionsList) {
      if (q.question_type === 'fill_blank') {
        q.answer_options = []; // Hide answer options for fill-in-the-blank to prevent cheating
      } else {
        const opts = await this.sessionsRepository.findAnswerOptionsByQuestionId(q.id);
        // Exclude is_correct before sending back
        q.answer_options = opts.map(opt => ({ id: opt.id, content: opt.content, order_index: opt.order_index }));
      }
    }

    const session = await this.sessionsRepository.createQuizSession({
      student_id: studentId,
      assignment_id: assignmentId,
      total_q: questionsList.length,
      status: 'in_progress'
    });

    const effectiveSessionMode = mode === 'review' ? 'review' : assignment.mode;

    const sessionState = {
      questions: questionsList,
      currentIndex: 0,
      total: questionsList.length,
      session_mode: effectiveSessionMode
    };

    this.sessionStateMap.set(session.id, sessionState);

    if (redisClient.isOpen) {
      const ttl = assignment.time_limit ? (assignment.time_limit * 60) + 600 : 86400; // time limit + 10 mins, or 24 hours
      await redisClient.setEx(`session:${session.id}`, ttl, JSON.stringify(sessionState)).catch(() => {});
    }

    return {
      session_id: session.id,
      assignment_title: assignment.title,
      assignment_mode: assignment.mode,
      mode: effectiveSessionMode,
      total_questions: questionsList.length,
      time_limit_seconds: assignment.time_limit ? assignment.time_limit * 60 : null,
      started_at: session.started_at,
      questions: questionsList,
      first_question: { ...questionsList[0], question_index: 1 }
    };
  }

  async submitAnswer(studentId: string, sessionId: string, data: any) {
    const { question_id, selected_option_id, response_time_ms } = data;

    let cacheState: any = null;
    if (redisClient.isOpen) {
      const cacheStr = await redisClient.get(`session:${sessionId}`).catch(() => null);
      if (cacheStr) {
        try { cacheState = JSON.parse(cacheStr); } catch (_) {}
      }
    }
    if (!cacheState) {
      cacheState = this.sessionStateMap.get(sessionId) || null;
    }

    const session = await this.sessionsRepository.findQuizSessionById(sessionId, true) as any;
    if (!session || session.status !== 'in_progress') throw new ApiError(400, 'Session not active');

    // [Best Practice Security]: Kiểm tra tính hợp lệ của thời gian làm bài (Anti-cheat bypass time limit)
    if (session.assignment && session.assignment.time_limit) {
      const elapsedMs = Date.now() - session.started_at.getTime();
      const limitMs = session.assignment.time_limit * 60 * 1000;
      // Cho phép trễ 15 giây (grace period) để đền bù mạng lag
      if (elapsedMs > limitMs + 15000) {
        // Bắt buộc nộp bài nếu cố tình trả lời khi quá giờ
        await this.finishSession(studentId, sessionId);
        throw new ApiError(403, 'Đã hết thời gian làm bài. Hệ thống từ chối nhận thêm câu trả lời.');
      }
    }

    // Get question difficulty and type from cache or database fallback
    let currentQuestion = cacheState?.questions?.find((q: any) => q.id === question_id);
    if (!currentQuestion) {
      currentQuestion = await this.sessionsRepository.findQuestionById(question_id);
    }
    const difficulty = currentQuestion?.difficulty || 3;


    // Check correct answer
    const options = await this.sessionsRepository.findAnswerOptionsByQuestionId(question_id);
    
    let isCorrect = false;
    const qType = currentQuestion?.question_type || currentQuestion?.type;

    if (qType === 'fill_blank') {
      if (data.fill_text) {
        const formatStr = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
        const userFill = formatStr(data.fill_text);
        const validOptions = options.filter(o => o.is_correct);
        isCorrect = validOptions.some(opt => formatStr(opt.content) === userFill);
      }
    } else if (qType === 'matching') {
      if (data.matching_pairs && currentQuestion?.metadata?.pairs) {
        const rawPairs = Array.isArray(currentQuestion.metadata.pairs) ? currentQuestion.metadata.pairs : [];
        const normalize = (s: any) => String(s || '').trim().toLowerCase();

        isCorrect = rawPairs.length > 0 && 
          data.matching_pairs.length === rawPairs.length && 
          rawPairs.every((cp: any, idx: number) => {
            const expectedLeftId = cp.leftId || `left_${idx}`;
            const expectedRightId = cp.rightId || `right_${idx}`;
            const expectedLeftText = normalize(cp.leftText);
            const expectedRightText = normalize(cp.rightText);

            return data.matching_pairs.some((up: any) => {
              if (up.leftId && up.rightId && up.leftId === expectedLeftId && up.rightId === expectedRightId) return true;
              if (up.leftText && up.rightText && normalize(up.leftText) === expectedLeftText && normalize(up.rightText) === expectedRightText) return true;
              return false;
            });
          });
      }
    } else {
      // multiple_choice or true_false
      const correctIds = options.filter(o => o.is_correct).map(o => o.id);
      
      if (data.selected_option_ids && data.selected_option_ids.length > 0) {
        const submittedIds = data.selected_option_ids;
        isCorrect = correctIds.length === submittedIds.length && correctIds.every((id: string) => submittedIds.includes(id));
      } else {
        // Fallback backward compatibility
        isCorrect = correctIds.length === 1 && correctIds[0] === selected_option_id;
      }
    }
    
    const effectiveMode = cacheState?.session_mode || (session?.assignment?.mode);
    const isSM2Eligible = effectiveMode === 'adaptive' || effectiveMode === 'review';

    // Fetch existing progress
    const progress = await this.sessionsRepository.findSM2Progress(studentId, question_id);

    // Run SM2 Algorithm - CHỈ áp dụng cho Luyện tập thích ứng (adaptive) và Phiên ôn tập (review)
    // Loại trừ hoàn toàn bài tập thông thường (standard) và bài thi (exam)
    let sm2Result = null;
    if (isSM2Eligible) {
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
        console.error('[CRITICAL SM2 FALLBACK] Lỗi tính toán SM-2:', e);
      }
    }

    let textAnswerToSave = data.fill_text || null;
    if ((qType === 'multi_select' || qType === 'multiple_choice' || qType === 'true_false') && data.selected_option_ids && data.selected_option_ids.length > 0) {
      textAnswerToSave = JSON.stringify(data.selected_option_ids);
    } else if (qType === 'matching' && data.matching_pairs) {
      textAnswerToSave = JSON.stringify(data.matching_pairs);
    }

    // Check if student has already answered this question in this session (allows changing answers during exams/free navigation)
    const existingAnswer = await this.sessionsRepository.findSessionAnswer(sessionId, question_id);

    if (existingAnswer) {
      await this.sessionsRepository.updateSessionAnswer(existingAnswer.id, {
        selected_option: selected_option_id || null,
        text_answer: textAnswerToSave,
        is_correct: isCorrect,
        response_time_ms,
        sm2_quality: sm2Result ? sm2Result.q : -1 
      });

      if (existingAnswer.is_correct !== isCorrect) {
        await this.sessionsRepository.updateQuizSession(sessionId, {
          correct_q: isCorrect ? { increment: 1 } : { decrement: 1 }
        });
      }
    } else {
      // Save Answer
      await this.sessionsRepository.createSessionAnswer({
        session_id: sessionId,
        question_id,
        selected_option: selected_option_id || null,
        text_answer: textAnswerToSave,
        is_correct: isCorrect,
        response_time_ms,
        sm2_quality: sm2Result ? sm2Result.q : -1 
      });

      // Update Session Counters
      await this.sessionsRepository.updateQuizSession(sessionId, {
        answered_q: { increment: 1 },
        correct_q: isCorrect ? { increment: 1 } : undefined
      });
    }

    // Cập nhật SM-2 nếu thuật toán tính toán thành công và phiên làm bài thuộc chế độ hợp lệ
    // CHỈ áp dụng cho Luyện tập thích ứng (adaptive) và Phiên ôn tập (review)
    // Loại trừ hoàn toàn bài tập thông thường (standard) và bài thi (exam)
    if (sm2Result && isSM2Eligible) {
      await this.sessionsRepository.upsertSM2Progress(
        { student_id_question_id: { student_id: studentId, question_id } },
        {
          student_id: studentId,
          question_id,
          easiness_factor: sm2Result.new_ef,
          interval_days: sm2Result.new_interval,
          repetition_count: sm2Result.new_repetition_count,
          next_review_date: new Date(sm2Result.next_review_date),
          total_attempts: 1,
          correct_attempts: isCorrect ? 1 : 0
        },
        {
          easiness_factor: sm2Result.new_ef,
          interval_days: sm2Result.new_interval,
          repetition_count: sm2Result.new_repetition_count,
          next_review_date: new Date(sm2Result.next_review_date),
          total_attempts: { increment: 1 },
          correct_attempts: isCorrect ? { increment: 1 } : undefined,
          last_reviewed_at: new Date()
        }
      );
    }

    let nextQuestion = null;
    if (cacheState) {
      cacheState.currentIndex++;
      if (cacheState.currentIndex < cacheState.total) {
        nextQuestion = { ...cacheState.questions[cacheState.currentIndex], question_index: cacheState.currentIndex + 1 };
      }
      this.sessionStateMap.set(sessionId, cacheState);
    }

    // Update cache if open
    if (redisClient.isOpen && cacheState) {
      const ttl = await redisClient.ttl(`session:${sessionId}`).catch(() => 0);
      if (ttl > 0) {
        await redisClient.setEx(`session:${sessionId}`, ttl, JSON.stringify(cacheState)).catch(() => {});
      }
    }

    // [Security & Exam Integrity]: In exam mode, never reveal answers, correctness, or explanations to student
    if (session?.assignment?.mode === 'exam') {
      return {
        submitted: true,
        next_question: nextQuestion
      };
    }

    const explanation = currentQuestion?.explanation || null;

    const correctOpt = options.find(o => o.is_correct);
    const correct_option_ids = options.filter(o => o.is_correct).map(o => o.id);

    const fill_blank_correct_text = qType === 'fill_blank' && !isCorrect
      ? options.filter(o => o.is_correct).map(o => o.content).join(' hoặc ')
      : undefined;

    const matching_correct_pairs = qType === 'matching' && !isCorrect && currentQuestion?.metadata?.pairs
      ? currentQuestion.metadata.pairs.map((p: any) => `${p.leftText} -> ${p.rightText}`)
      : undefined;

    const choice_correct_texts = (qType === 'multiple_choice' || qType === 'multi_select' || qType === 'true_false') && !isCorrect
      ? options.filter(o => o.is_correct).map(o => o.content)
      : undefined;

    return {
      is_correct: isCorrect,
      correct_option_id: correctOpt?.id,
      correct_option_ids,
      fill_blank_correct_text,
      matching_correct_pairs,
      choice_correct_texts,
      explanation: explanation,
      sm2_quality: sm2Result ? sm2Result.q : -1,
      next_review_in_days: sm2Result ? sm2Result.new_interval : (progress ? progress.interval_days : 1),
      next_question: nextQuestion,
      session_progress: {
        answered: cacheState ? cacheState.currentIndex : session.answered_q + 1,
        total: cacheState ? cacheState.total : session.total_q,
        correct_so_far: session.correct_q + (isCorrect ? 1 : 0)
      }
    };
  }

  async finishSession(studentId: string, sessionId: string) {
    const session = await this.sessionsRepository.findQuizSessionWithAnswers(sessionId);
    if (!session || session.student_id !== studentId) throw new ApiError(404, 'Session not found');

    const cacheState = this.sessionStateMap.get(sessionId);
    const effectiveMode = cacheState?.session_mode || (session.assignment?.mode);
    const isSM2Eligible = effectiveMode === 'adaptive' || effectiveMode === 'review';

    const totalQuestions = session.total_q > 0 ? session.total_q : (session.session_answers.length || 1);
    const correctCount = session.session_answers.filter(a => a.is_correct).length;
    const answeredCount = session.session_answers.length;

    // Exam scoring: unattempted questions earn 0 points, denominator is total_questions
    const denominator = session.assignment?.mode === 'exam' ? totalQuestions : (answeredCount || 1);
    const score = denominator > 0 ? Math.round(((correctCount / denominator) * 100) * 10) / 10 : 0;
    const finishedAt = new Date();
    const durationSeconds = Math.floor((finishedAt.getTime() - session.started_at.getTime()) / 1000);

    await this.sessionsRepository.updateQuizSession(sessionId, {
      status: 'completed',
      finished_at: finishedAt,
      answered_q: answeredCount,
      correct_q: correctCount,
      score
    });

    // Ensure SM-2 progress is guaranteed for all answered questions in adaptive/review sessions
    if (isSM2Eligible) {
      for (const ans of session.session_answers) {
        try {
          const progress = await this.sessionsRepository.findSM2Progress(studentId, ans.question_id);
          const sm2Result = updateSM2({
            progress: progress ? {
              easiness_factor: Number(progress.easiness_factor),
              interval_days: progress.interval_days,
              repetition_count: progress.repetition_count
            } : null,
            is_correct: ans.is_correct,
            response_time_ms: ans.response_time_ms || 5000,
            difficulty: (ans.question as any)?.difficulty || 3,
            question_type: (ans.question as any)?.question_type as any
          });

          await this.sessionsRepository.upsertSM2Progress(
            { student_id_question_id: { student_id: studentId, question_id: ans.question_id } },
            {
              student_id: studentId,
              question_id: ans.question_id,
              easiness_factor: sm2Result.new_ef,
              interval_days: sm2Result.new_interval,
              repetition_count: sm2Result.new_repetition_count,
              next_review_date: new Date(sm2Result.next_review_date),
              total_attempts: 1,
              correct_attempts: ans.is_correct ? 1 : 0,
              last_reviewed_at: finishedAt
            },
            {
              easiness_factor: sm2Result.new_ef,
              interval_days: sm2Result.new_interval,
              repetition_count: sm2Result.new_repetition_count,
              next_review_date: new Date(sm2Result.next_review_date),
              total_attempts: { increment: 1 },
              correct_attempts: ans.is_correct ? { increment: 1 } : undefined,
              last_reviewed_at: finishedAt
            }
          );
        } catch (err) {
          console.error('[SM2 Sync on Finish Error]:', err);
        }
      }
    }

    this.sessionStateMap.delete(sessionId);

    if (redisClient.isOpen) {
      await redisClient.del(`session:${sessionId}`).catch(() => {});
      await redisClient.del(`student:summary:${studentId}`).catch(() => {});
      await redisClient.del(`student:dashboard_summary:${studentId}`).catch(() => {});
      await redisClient.del(`analytics:student:${studentId}`).catch(() => {});
    }

    // Topic performance logic
    const { performance_by_topic, weakestTopic } = await this.computeTopicPerformance(session.session_answers);

    return {
      session_id: sessionId,
      score,
      total_questions: totalQuestions,
      answered_questions: answeredCount,
      correct_questions: correctCount,
      duration_seconds: durationSeconds,
      finished_at: finishedAt,
      performance_by_topic,
      weakest_topic: weakestTopic,
      session_answers: session.session_answers
    };
  }

  async abandonSession(studentId: string, sessionId: string) {
    const session = await this.sessionsRepository.findQuizSessionById(sessionId);
    if (!session || session.student_id !== studentId) throw new ApiError(404, 'Session not found');

    this.sessionStateMap.delete(sessionId);

    if (redisClient.isOpen) {
      await redisClient.del(`session:${sessionId}`).catch(() => {});
      await redisClient.del(`student:dashboard_summary:${studentId}`).catch(() => {});
    }

    await this.sessionsRepository.updateQuizSession(sessionId, {
      status: 'abandoned',
      finished_at: new Date()
    });
  }

  async getSessionInfo(studentId: string, sessionId: string) {
    const session = await this.sessionsRepository.findQuizSessionById(sessionId);
    if (!session || session.student_id !== studentId) throw new ApiError(404, 'Session not found');
    
    return {
      status: session.status,
      total_q: session.total_q,
      answered_q: session.answered_q,
      correct_q: session.correct_q,
      score: session.score,
      started_at: session.started_at,
      finished_at: session.finished_at
    };
  }

  async getSessionResult(userId: string, sessionId: string, role?: string) {
    const session = await this.sessionsRepository.findQuizSessionWithAnswers(sessionId);
    if (!session) throw new ApiError(404, 'Session not found');
    
    if (role === 'student' && session.student_id !== userId) {
      throw new ApiError(404, 'Session not found');
    }
    // If not student, assume teacher/admin and allow viewing.
    
    if (session.status !== 'completed') throw new ApiError(400, 'Session is not completed yet');

    const score = session.score || 0;
    const durationSeconds = session.finished_at ? Math.floor((session.finished_at.getTime() - session.started_at.getTime()) / 1000) : 0;

    // Topic performance logic
    const { performance_by_topic, weakestTopic } = await this.computeTopicPerformance(session.session_answers);

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
  }
}

import { updateSM2 } from '@adaptive-lang/sm2-engine';
import redisClient from '../../lib/redis';
import { SM2Repository } from '../sm2/sm2.repository';
import { ApiError } from '../../lib/ApiError';
import { SessionsRepository } from './sessions.repository';

import { AiService } from '../ai/ai.service';

export class SessionsService {
  constructor(
    private readonly sessionsRepository: SessionsRepository, 
    private readonly sm2Repository: SM2Repository,
    private readonly aiService: AiService
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

  async startSession(studentId: string, assignmentId: string) {
    // Automatically abandon any stale/unfinished in_progress sessions for this student & assignment
    const staleIds = await this.sessionsRepository.abandonStaleSessions(studentId, assignmentId);
    if (redisClient.isOpen && staleIds.length > 0) {
      for (const sId of staleIds) {
        await redisClient.del(`session:${sId}`).catch(() => {});
      }
    }

    const assignment = await this.sessionsRepository.findAssignmentById(assignmentId);
    if (!assignment || !assignment.is_published) throw new ApiError(404, 'Assignment not found or not published');

    // Check attempts
    if (assignment.max_attempts > 0 && assignment.mode !== 'adaptive') {
      const attempts = await this.sessionsRepository.countCompletedSessions(studentId, assignmentId);
      if (attempts >= assignment.max_attempts) throw new ApiError(403, 'Max attempts reached');
    }

    let questionsList: any[] = [];

    if (assignment.mode === 'adaptive') {
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

    if (redisClient.isOpen) {
      const ttl = assignment.time_limit ? (assignment.time_limit * 60) + 600 : 86400; // time limit + 10 mins, or 24 hours
      await redisClient.setEx(`session:${session.id}`, ttl, JSON.stringify({
        questions: questionsList,
        currentIndex: 0,
        total: questionsList.length
      })).catch(() => {});
    }

    return {
      session_id: session.id,
      assignment_title: assignment.title,
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

    // Get question difficulty from cache or database fallback
    const currentQuestion = cacheState?.questions?.find((q: any) => q.id === question_id);
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
        const correctPairs = currentQuestion.metadata.pairs;
        isCorrect = correctPairs.length > 0 && correctPairs.every((cp: any) => 
          data.matching_pairs.some((up: any) => up.leftId === cp.leftId && up.rightId === cp.rightId)
        ) && data.matching_pairs.length === correctPairs.length;
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
    
    const correctOpt = options.find(o => o.is_correct); // Keep for backwards compatibility for ai explanation

    // Fetch existing progress
    const progress = await this.sessionsRepository.findSM2Progress(studentId, question_id);

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
      console.error('🚨 [CRITICAL SM2 FALLBACK] Lỗi tính toán SM-2:', e);
    }

    let textAnswerToSave = data.fill_text || null;
    if ((qType === 'multi_select' || qType === 'multiple_choice' || qType === 'true_false') && data.selected_option_ids && data.selected_option_ids.length > 0) {
      textAnswerToSave = JSON.stringify(data.selected_option_ids);
    } else if (qType === 'matching' && data.matching_pairs) {
      textAnswerToSave = JSON.stringify(data.matching_pairs);
    }

    // Save Answer (Luôn luôn lưu lịch sử làm bài để tính điểm)
    await this.sessionsRepository.createSessionAnswer({
      session_id: sessionId,
      question_id,
      selected_option: selected_option_id || null,
      text_answer: textAnswerToSave,
      is_correct: isCorrect,
      response_time_ms,
      sm2_quality: sm2Result ? sm2Result.q : -1 
    });

    // [Best Practice Data Integrity]: CHỈ cập nhật SM-2 nếu thuật toán chạy thành công VÀ bài tập có kiểu là adaptive
    if (sm2Result && session?.assignment?.mode === 'adaptive') {
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

    // Update Session Counters
    await this.sessionsRepository.updateQuizSession(sessionId, {
      answered_q: { increment: 1 },
      correct_q: isCorrect ? { increment: 1 } : undefined
    });

    let nextQuestion = null;
    if (cacheState) {
      cacheState.currentIndex++;
      if (cacheState.currentIndex < cacheState.total) {
        nextQuestion = { ...cacheState.questions[cacheState.currentIndex], question_index: cacheState.currentIndex + 1 };
      }
    }

    // Update cache if open
    if (redisClient.isOpen && cacheState) {
      const ttl = await redisClient.ttl(`session:${sessionId}`).catch(() => 0);
      if (ttl > 0) {
        await redisClient.setEx(`session:${sessionId}`, ttl, JSON.stringify(cacheState)).catch(() => {});
      }
    }

    let explanation = currentQuestion?.explanation || null;

    if (!isCorrect && correctOpt) {
      const questionContext = currentQuestion?.content || 'Unknown context';
      try {
        const aiExp = await Promise.race([
          this.aiService.getExplanation(question_id, selected_option_id, questionContext),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
        ]);
        
        if (aiExp) {
          console.log('[sessions.service] Nhận được AI Explanation kịp thời!');
          explanation = aiExp;
        } else {
          console.log('[sessions.service] AI Explanation bị Timeout (quá 5 giây), dùng mặc định!');
        }
      } catch (e) {
        console.error('AI Explanation Error:', e);
      }
    }

    const fill_blank_correct_text = qType === 'fill_blank' && !isCorrect
      ? options.filter(o => o.is_correct).map(o => o.content).join(' hoặc ')
      : undefined;

    const matching_correct_pairs = qType === 'matching' && !isCorrect && currentQuestion?.metadata?.pairs
      ? currentQuestion.metadata.pairs.map((p: any) => `${p.leftText} ➔ ${p.rightText}`)
      : undefined;

    const choice_correct_texts = (qType === 'multiple_choice' || qType === 'multi_select' || qType === 'true_false') && !isCorrect
      ? options.filter(o => o.is_correct).map(o => o.content)
      : undefined;

    return {
      is_correct: isCorrect,
      correct_option_id: correctOpt?.id,
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

    const score = session.answered_q > 0 ? (session.correct_q / session.answered_q) * 100 : 0;
    const finishedAt = new Date();
    const durationSeconds = Math.floor((finishedAt.getTime() - session.started_at.getTime()) / 1000);

    await this.sessionsRepository.updateQuizSession(sessionId, {
      status: 'completed',
      finished_at: finishedAt,
      score
    });

    if (redisClient.isOpen) {
      await redisClient.del(`session:${sessionId}`).catch(() => {});
    }

    // Topic performance logic
    const { performance_by_topic, weakestTopic } = await this.computeTopicPerformance(session.session_answers);

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
  }

  async abandonSession(studentId: string, sessionId: string) {
    const session = await this.sessionsRepository.findQuizSessionById(sessionId);
    if (!session || session.student_id !== studentId) throw new ApiError(404, 'Session not found');

    if (redisClient.isOpen) {
      await redisClient.del(`session:${sessionId}`).catch(() => {});
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

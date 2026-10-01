import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useQuizSession, useSubmitAnswer, useFinishQuiz, useAbandonQuiz } from './hooks/useQuizData';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { QuizHeader } from './components/QuizHeader';
import { QuizQuestion } from './components/QuizQuestion';
import { QuizFeedback } from './components/QuizFeedback';
import { QuizOverlays } from './components/QuizOverlays';
import { PracticeHub } from './components/PracticeHub';
import { QuestionPalette } from './components/QuestionPalette';
import { ExamSubmitModal } from './components/ExamSubmitModal';
import { ExamActionBar } from './components/ExamActionBar';

const EMPTY_ARRAY: any[] = [];

export const StudentQuizFeature: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');
  const mode = searchParams.get('mode') || undefined;
  const topicId = searchParams.get('topic') || undefined;
  const { t } = useTranslation();

  if (!assignmentId) {
    return <PracticeHub />;
  }

  const { data: session } = useQuizSession(assignmentId, mode, topicId);
  const { mutateAsync: submitAnswer } = useSubmitAnswer();
  const { mutateAsync: finishSession } = useFinishQuiz();
  const { mutateAsync: abandonSession } = useAbandonQuiz();

  const questions = session.questions || [];
  const isExam = session?.assignment_mode === 'exam' || session?.mode === 'exam' || mode === 'exam';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    if (session.remaining_seconds !== undefined && session.remaining_seconds !== null) {
      return session.remaining_seconds;
    }
    if (!session.time_limit_seconds) return null;
    if (session.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
      return Math.max(0, session.time_limit_seconds - elapsed);
    }
    return session.time_limit_seconds;
  });

  // Practice mode states
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctAnswerId, setCorrectAnswerId] = useState<string | null>(null);
  const [correctAnswerIds, setCorrectAnswerIds] = useState<string[]>([]);
  const [submitExplanation, setSubmitExplanation] = useState<string | null>(null);
  const [submitFillBlankAnswer, setSubmitFillBlankAnswer] = useState<string | null>(null);
  const [submitMatchingPairs, setSubmitMatchingPairs] = useState<string[] | null>(null);
  const [submitChoiceTexts, setSubmitChoiceTexts] = useState<string[] | null>(null);

  // Exam mode states - Phục hồi câu trả lời cũ nếu phiên thi được tiếp tục (resume)
  const [examAnswers, setExamAnswers] = useState<Record<string, {
    optId?: string;
    optIds?: string[];
    fillText?: string;
    matchingPairs?: any[];
  }>>(() => {
    const initial: Record<string, any> = {};
    const existingList = session.existing_answers || session.answers || [];
    if (Array.isArray(existingList)) {
      existingList.forEach((ans: any) => {
        let optIds: string[] | undefined = undefined;
        let matchingPairs: any[] | undefined = undefined;
        let fillText: string | undefined = undefined;

        if (ans.text_answer) {
          try {
            const parsed = JSON.parse(ans.text_answer);
            if (Array.isArray(parsed)) {
              if (parsed.length > 0 && typeof parsed[0] === 'object') {
                matchingPairs = parsed;
              } else {
                optIds = parsed;
              }
            } else {
              fillText = ans.text_answer;
            }
          } catch {
            fillText = ans.text_answer;
          }
        }

        initial[ans.question_id] = {
          optId: ans.selected_option || undefined,
          optIds,
          fillText,
          matchingPairs
        };
      });
    }
    return initial;
  });
  const [flaggedIndices, setFlaggedIndices] = useState<Set<number>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showMobilePalette, setShowMobilePalette] = useState<boolean>(false);

  // Multi-tab exam lock states
  const tabId = useRef(Math.random().toString(36).substring(2)).current;
  const [isDuplicateTab, setIsDuplicateTab] = useState(false);

  // Common states
  const [submitting, setSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [warningData, setWarningData] = useState<{count: number, max: number} | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const startTimeRef = useRef<number>(Date.now());

  const handleFinishQuiz = useCallback(async () => {
    try {
      const result = await finishSession(session.id);
      navigate(`/session-result?id=${session.id}`, { state: result });
    } catch (err: any) {
      alert(t('student.quiz.errorFinishing'));
      navigate('/student');
    }
  }, [session.id, finishSession, navigate, t]);

  const { warnings, maxWarnings } = useAntiCheat({
    onForceSubmit: () => {
      setWarningData(null);
      setIsTimeUp(true);
      setTimeout(() => {
        handleFinishQuiz();
      }, 2000);
    },
    onWarning: (count, max) => {
      setWarningData({ count, max });
    },
    enabled: questions.length > 0 && !isTimeUp && !isDuplicateTab
  });

  // Multi-tab lock heartbeat and broadcast for Exam mode
  useEffect(() => {
    if (!isExam || !assignmentId) return;

    const lockKey = `exam_tab_lock_${assignmentId}`;
    const channelName = `exam_tab_channel_${assignmentId}`;
    let channel: BroadcastChannel | null = null;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(channelName);
        channel.onmessage = (event) => {
          if (event.data?.type === 'CLAIM_LOCK' && event.data?.tabId !== tabId) {
            setIsDuplicateTab(true);
          }
        };
      } catch (_) {}
    }

    const checkAndAcquireLock = () => {
      const rawLock = localStorage.getItem(lockKey);
      const now = Date.now();
      if (rawLock) {
        try {
          const parsed = JSON.parse(rawLock);
          if (parsed.tabId !== tabId && (now - parsed.timestamp) < 4000) {
            setIsDuplicateTab(true);
            return false;
          }
        } catch (_) {}
      }

      localStorage.setItem(lockKey, JSON.stringify({ tabId, timestamp: now }));
      setIsDuplicateTab(false);
      try {
        channel?.postMessage({ type: 'CLAIM_LOCK', tabId });
      } catch (_) {}
      return true;
    };

    checkAndAcquireLock();

    const heartbeat = setInterval(() => {
      const rawLock = localStorage.getItem(lockKey);
      const now = Date.now();
      if (rawLock) {
        try {
          const parsed = JSON.parse(rawLock);
          if (parsed.tabId === tabId) {
            localStorage.setItem(lockKey, JSON.stringify({ tabId, timestamp: now }));
          } else if (now - parsed.timestamp < 4000) {
            setIsDuplicateTab(true);
          }
        } catch (_) {}
      } else {
        localStorage.setItem(lockKey, JSON.stringify({ tabId, timestamp: now }));
      }
    }, 1500);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === lockKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.tabId !== tabId && (Date.now() - parsed.timestamp) < 4000) {
            setIsDuplicateTab(true);
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const handleUnload = () => {
      const rawLock = localStorage.getItem(lockKey);
      if (rawLock) {
        try {
          const parsed = JSON.parse(rawLock);
          if (parsed.tabId === tabId) {
            localStorage.removeItem(lockKey);
          }
        } catch (_) {}
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleUnload);
      try {
        channel?.close();
      } catch (_) {}
      handleUnload();
    };
  }, [isExam, assignmentId, tabId]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      setIsTimeUp(true);
      const timer = setTimeout(() => {
        handleFinishQuiz();
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (!isExam && (submitting || feedback)) return;

    const timer = setInterval(() => {
      if (session.started_at && session.time_limit_seconds) {
        const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
        const remaining = Math.max(0, session.time_limit_seconds - elapsed);
        if (remaining <= 0) {
          clearInterval(timer);
          setTimeLeft(0);
          setIsTimeUp(true);
          setTimeout(() => {
            handleFinishQuiz();
          }, 2000);
        } else {
          setTimeLeft(remaining);
        }
      } else {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            setIsTimeUp(true);
            setTimeout(() => {
              handleFinishQuiz();
            }, 3000);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting, feedback, isExam, handleFinishQuiz, session.started_at, session.time_limit_seconds]);

  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q, idx) => {
      const ans = examAnswers[q.id];
      if (!ans) return;
      if (ans.optId) set.add(idx);
      else if (ans.optIds && ans.optIds.length > 0) set.add(idx);
      else if (ans.fillText && ans.fillText.trim().length > 0) set.add(idx);
      else if (ans.matchingPairs && ans.matchingPairs.length > 0) set.add(idx);
    });
    return set;
  }, [questions, examAnswers]);

  if (questions.length === 0) {
    return (
      <div className="h-screen bg-[#FDFBF7] flex items-center justify-center text-zinc-400 font-black text-4xl uppercase tracking-tighter">
        {t('student.quiz.noQuestions')}
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  const handleSelect = async (payloadData: { optId?: string; optIds?: string[]; fillText?: string; matchingPairs?: any[] }) => {
    if (!isExam && (feedback || submitting)) return;
    if (payloadData.optId) setSelectedOptionId(payloadData.optId);
    if (payloadData.optIds) setSelectedOptionIds(payloadData.optIds);

    if (isExam) {
      setExamAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          ...payloadData
        }
      }));
    }

    setSubmitting(true);
    const responseTimeMs = Date.now() - startTimeRef.current;

    try {
      const payload: any = {
        question_id: currentQuestion.id,
        response_time_ms: responseTimeMs
      };
      if (payloadData.optId) payload.selected_option_id = payloadData.optId;
      if (payloadData.optIds) payload.selected_option_ids = payloadData.optIds;
      if (payloadData.fillText !== undefined) payload.fill_text = payloadData.fillText;
      if (payloadData.matchingPairs !== undefined) payload.matching_pairs = payloadData.matchingPairs;

      const response = await submitAnswer({ sessionId: session.id, payload });

      if (isExam) {
        // In exam mode, never reveal answer or explanation
        return;
      }

      const isCorrect = response.is_correct;
      setSubmitExplanation(response.explanation || null);
      if (response.fill_blank_correct_text) setSubmitFillBlankAnswer(response.fill_blank_correct_text);
      if (response.matching_correct_pairs) setSubmitMatchingPairs(response.matching_correct_pairs);
      if (response.choice_correct_texts) setSubmitChoiceTexts(response.choice_correct_texts);
      
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      if (!isCorrect) {
        if (currentQuestion.question_type === 'multi_select') {
           setCorrectAnswerIds(
             currentQuestion.answer_options?.filter(o => o.is_correct).map(o => o.id) || []
           );
        } else {
           setCorrectAnswerId(
             response.correct_option_id || 
             currentQuestion.answer_options?.find(o => o.is_correct)?.id || 
             null
           );
        }
      } else {
        setCorrectAnswerId(payloadData.optId || null);
        setCorrectAnswerIds(payloadData.optIds || []);
      }
    } catch (err: any) {
      if (!isExam) {
        alert(t('student.quiz.submitFailed'));
        setSelectedOptionId(null);
        setSelectedOptionIds([]);
      } else {
        console.error("Failed to auto-save answer:", err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFeedback(null);
      setSelectedOptionId(null);
      setSelectedOptionIds([]);
      setCorrectAnswerId(null);
      setCorrectAnswerIds([]);
      setSubmitExplanation(null);
      setSubmitFillBlankAnswer(null);
      setSubmitMatchingPairs(null);
      setSubmitChoiceTexts(null);
      startTimeRef.current = Date.now();
    } else {
      handleFinishQuiz();
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      startTimeRef.current = Date.now();
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      startTimeRef.current = Date.now();
    }
  };

  const handleJumpQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      setShowMobilePalette(false);
      startTimeRef.current = Date.now();
    }
  };

  const handleToggleFlag = () => {
    setFlaggedIndices(prev => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  const handleSubmitExam = () => {
    setShowSubmitModal(true);
  };

  const handleConfirmSubmitExam = async () => {
    setShowSubmitModal(false);
    await handleFinishQuiz();
  };

  if (isDuplicateTab) {
    return (
      <div className="h-screen w-full bg-zinc-900 text-white flex items-center justify-center p-6 select-none">
        <div className="max-w-md w-full bg-white text-zinc-900 border-4 border-zinc-900 p-8 shadow-[12px_12px_0_0_#dc2626]">
          <div className="inline-block px-3 py-1 bg-red-600 text-white font-mono text-xs font-black uppercase mb-4">
            {t('student.quiz.antiCheatAlert', 'BẢO MẬT BÀI THI')}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-3">
            {t('student.quiz.duplicateTabTitle', 'BÀI THI ĐANG MỞ Ở TAB KHÁC')}
          </h2>
          <p className="text-zinc-600 font-medium mb-6 leading-relaxed text-sm">
            {t('student.quiz.duplicateTabDesc', 'Hệ thống phát hiện bài thi này đang được mở trên một tab hoặc cửa sổ khác. Để chống gian lận và bảo toàn thời gian làm bài, bạn chỉ có thể thao tác trên một tab duy nhất.')}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                const lockKey = `exam_tab_lock_${assignmentId}`;
                localStorage.setItem(lockKey, JSON.stringify({ tabId, timestamp: Date.now() }));
                setIsDuplicateTab(false);
                try {
                  const ch = new BroadcastChannel(`exam_tab_channel_${assignmentId}`);
                  ch.postMessage({ type: 'CLAIM_LOCK', tabId });
                  ch.close();
                } catch (_) {}
              }}
              className="w-full bg-zinc-900 text-white py-3 px-4 font-black uppercase tracking-wider text-sm hover:bg-zinc-800 transition-colors border-2 border-zinc-900 shadow-[4px_4px_0_0_rgba(24,24,27,1)] hover:translate-y-0.5 hover:shadow-none"
            >
              {t('student.quiz.takeoverTab', 'Chuyển làm bài sang tab này')}
            </button>
            <button
              onClick={() => navigate('/student')}
              className="w-full bg-zinc-100 text-zinc-700 py-3 px-4 font-bold uppercase tracking-wider text-sm hover:bg-zinc-200 transition-colors border-2 border-zinc-300"
            >
              {t('student.quiz.backToDashboard', 'Về trang chủ học sinh')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#FDFBF7] text-zinc-900 flex flex-col relative overflow-hidden font-sans selection:bg-indigo-600 selection:text-white select-none">
      <QuizHeader 
        progress={progress}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        timeLeft={timeLeft}
        warnings={warnings}
        maxWarnings={maxWarnings}
        onLeaveQuiz={() => setShowExitConfirm(true)}
        isExam={isExam}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto flex flex-col">
          <QuizQuestion 
            key={currentQuestion.id}
            question={currentQuestion}
            selectedOptionId={isExam ? (examAnswers[currentQuestion.id]?.optId || null) : selectedOptionId}
            correctAnswerId={correctAnswerId}
            selectedOptionIds={isExam ? (examAnswers[currentQuestion.id]?.optIds || EMPTY_ARRAY) : selectedOptionIds}
            correctAnswerIds={correctAnswerIds}
            feedback={isExam ? null : feedback}
            submitting={submitting}
            onSelect={handleSelect}
            isExam={isExam}
            initialFillText={isExam ? (examAnswers[currentQuestion.id]?.fillText || '') : ''}
            initialMatchingPairs={isExam ? (examAnswers[currentQuestion.id]?.matchingPairs || EMPTY_ARRAY) : EMPTY_ARRAY}
          />
        </div>

        {/* Desktop Question Palette Sidebar */}
        {isExam && (
          <div className="hidden lg:block h-full pr-6 pb-6 pt-2">
            <QuestionPalette 
              totalQuestions={questions.length}
              currentIndex={currentIndex}
              answeredIndices={answeredIndices}
              flaggedIndices={flaggedIndices}
              onSelectQuestion={handleJumpQuestion}
              onSubmitExam={handleSubmitExam}
              isSubmitting={submitting}
            />
          </div>
        )}
      </div>

      {/* Mobile Palette Drawer */}
      {isExam && showMobilePalette && (
        <div className="lg:hidden fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-[85%] max-w-sm h-full bg-white p-4 flex flex-col space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-2">
              <span className="font-black text-sm uppercase tracking-tight text-zinc-900">
                {t('student.quiz.paletteTitle', 'BẢNG CÂU HỎI')}
              </span>
              <button 
                onClick={() => setShowMobilePalette(false)}
                className="p-1 border-2 border-zinc-900 hover:bg-zinc-100"
              >
                <X className="w-5 h-5 text-zinc-900" />
              </button>
            </div>
            <QuestionPalette 
              totalQuestions={questions.length}
              currentIndex={currentIndex}
              answeredIndices={answeredIndices}
              flaggedIndices={flaggedIndices}
              onSelectQuestion={handleJumpQuestion}
              onSubmitExam={handleSubmitExam}
              isSubmitting={submitting}
            />
          </div>
        </div>
      )}

      {/* Action / Feedback Bar */}
      {isExam ? (
        <ExamActionBar 
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          isFlagged={flaggedIndices.has(currentIndex)}
          onToggleFlag={handleToggleFlag}
          onPrev={handlePrevQuestion}
          onNext={handleNextQuestion}
          onSubmit={handleSubmitExam}
          onTogglePalette={() => setShowMobilePalette(prev => !prev)}
        />
      ) : (
        <QuizFeedback 
          feedback={feedback}
          onNext={handleNext}
          isLastQuestion={currentIndex === questions.length - 1}
          explanation={submitExplanation}
          fillBlankAnswer={submitFillBlankAnswer}
          matchingPairs={submitMatchingPairs}
          choiceTexts={submitChoiceTexts}
          question={currentQuestion}
        />
      )}

      {/* Overlays */}
      <QuizOverlays 
        isTimeUp={isTimeUp}
        warnings={warnings}
        maxWarnings={maxWarnings}
        warningData={warningData}
        onDismissWarning={() => setWarningData(null)}
      />

      {/* Exam Submit Confirmation Modal */}
      {isExam && (
        <ExamSubmitModal 
          isOpen={showSubmitModal}
          totalQuestions={questions.length}
          answeredCount={answeredIndices.size}
          unansweredCount={Math.max(0, questions.length - answeredIndices.size)}
          flaggedCount={flaggedIndices.size}
          timeLeft={timeLeft}
          onCancel={() => setShowSubmitModal(false)}
          onConfirm={handleConfirmSubmitExam}
          isSubmitting={submitting}
        />
      )}

      {/* Exit Confirmation Dialog */}
      {!isExam && showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-zinc-900 max-w-md w-full p-8 shadow-[12px_12px_0_0_#4f46e5]">
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-zinc-900">
              {t('student.quiz.confirmExit')}
            </h3>
            <p className="text-zinc-600 font-medium text-lg mb-8">
              {t('student.quiz.confirmExitWarning') || "Tiến trình làm bài của bạn sẽ không được lưu. Bạn có chắc chắn muốn thoát?"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 border-2 border-zinc-900 px-6 py-4 font-bold uppercase tracking-widest hover:bg-zinc-100 transition-colors"
              >
                {t('common.ui.cancel')}
              </button>
              <button 
                onClick={async () => {
                  try {
                    await abandonSession(session.id);
                  } catch (e) {
                    console.error("Failed to abandon session", e);
                  }
                  navigate('/student');
                }}
                className="flex-1 border-2 border-red-600 bg-red-600 text-white px-6 py-4 font-bold uppercase tracking-widest hover:bg-zinc-900 hover:border-zinc-900 transition-colors shadow-[4px_4px_0_0_rgba(24,24,27,1)] hover:translate-y-1 hover:shadow-none"
              >
                {t('student.quiz.leaveQuiz')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQuizFeature;

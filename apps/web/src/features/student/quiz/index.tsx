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

  // Exam mode states
  const [examAnswers, setExamAnswers] = useState<Record<string, {
    optId?: string;
    optIds?: string[];
    fillText?: string;
    matchingPairs?: any[];
  }>>({});
  const [flaggedIndices, setFlaggedIndices] = useState<Set<number>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showMobilePalette, setShowMobilePalette] = useState<boolean>(false);

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
    enabled: questions.length > 0 && !isTimeUp
  });

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    if (!isExam && (submitting || feedback)) return;

    const timer = setInterval(() => {
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
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting, feedback, isExam, handleFinishQuiz]);

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
      {showExitConfirm && (
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

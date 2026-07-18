import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuizSession, useSubmitAnswer, useFinishQuiz, useAbandonQuiz } from './hooks/useQuizData';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { QuizHeader } from './components/QuizHeader';
import { QuizQuestion } from './components/QuizQuestion';
import { QuizFeedback } from './components/QuizFeedback';
import { QuizOverlays } from './components/QuizOverlays';

export const StudentQuizFeature: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');
  const { t } = useTranslation();

  if (!assignmentId) {
    return (
      <div className="h-screen bg-[#FDFBF7] flex items-center justify-center text-red-600 font-bold text-2xl uppercase tracking-widest">
        {t('student.quiz.selectAssignment')}
      </div>
    );
  }

  const { data: session } = useQuizSession(assignmentId);
  const { mutateAsync: submitAnswer } = useSubmitAnswer();
  const { mutateAsync: finishSession } = useFinishQuiz();
  const { mutateAsync: abandonSession } = useAbandonQuiz();

  const questions = session.questions || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    if (!session.time_limit_seconds) return null;
    if (session.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
      return Math.max(0, session.time_limit_seconds - elapsed);
    }
    return session.time_limit_seconds;
  });
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctAnswerId, setCorrectAnswerId] = useState<string | null>(null);
  const [correctAnswerIds, setCorrectAnswerIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [warningData, setWarningData] = useState<{count: number, max: number} | null>(null);
  const [submitExplanation, setSubmitExplanation] = useState<string | null>(null);
  const [submitFillBlankAnswer, setSubmitFillBlankAnswer] = useState<string | null>(null);
  const [submitMatchingPairs, setSubmitMatchingPairs] = useState<string[] | null>(null);
  const [submitChoiceTexts, setSubmitChoiceTexts] = useState<string[] | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const startTimeRef = useRef<number>(Date.now());

  const handleFinishQuiz = useCallback(async () => {
    try {
      const result = await finishSession(session.id);
      navigate('/session-result', { state: result });
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
    if (timeLeft === null || timeLeft <= 0 || submitting || feedback) return;

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
  }, [timeLeft, submitting, feedback, handleFinishQuiz]);

  if (questions.length === 0) {
    return (
      <div className="h-screen bg-[#FDFBF7] flex items-center justify-center text-zinc-400 font-black text-4xl uppercase tracking-tighter">
        {t('student.quiz.noQuestions')}
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  const handleSelect = async (payloadData: { optId?: string, optIds?: string[], fillText?: string, matchingPairs?: any[] }) => {
    if (feedback || submitting) return;
    if (payloadData.optId) setSelectedOptionId(payloadData.optId);
    if (payloadData.optIds) setSelectedOptionIds(payloadData.optIds);
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
      alert(t('student.quiz.submitFailed'));
      setSelectedOptionId(null);
      setSelectedOptionIds([]);
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

      <QuizQuestion 
        question={currentQuestion}
        selectedOptionId={selectedOptionId}
        correctAnswerId={correctAnswerId}
        selectedOptionIds={selectedOptionIds}
        correctAnswerIds={correctAnswerIds}
        feedback={feedback}
        submitting={submitting}
        onSelect={handleSelect}
      />

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

      <QuizOverlays 
        isTimeUp={isTimeUp}
        warnings={warnings}
        maxWarnings={maxWarnings}
        warningData={warningData}
        onDismissWarning={() => setWarningData(null)}
      />

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

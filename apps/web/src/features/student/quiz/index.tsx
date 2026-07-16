import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuizSession, useSubmitAnswer, useFinishQuiz } from './hooks/useQuizData';
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

  const questions = session.questions || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(session.time_limit_seconds || null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctAnswerId, setCorrectAnswerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [warningData, setWarningData] = useState<{count: number, max: number} | null>(null);
  
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

  const handleSelect = async (optId?: string, text?: string) => {
    if (feedback || submitting) return;
    if (optId) setSelectedOptionId(optId);
    setSubmitting(true);

    const responseTimeMs = Date.now() - startTimeRef.current;

    try {
      const payload: any = {
        question_id: currentQuestion.id,
        response_time_ms: responseTimeMs
      };
      if (optId) payload.selected_option_id = optId;
      if (text !== undefined) payload.fill_text = text;

      const response = await submitAnswer({ sessionId: session.id, payload });

      const isCorrect = response.is_correct;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      if (!isCorrect) {
        setCorrectAnswerId(
          response.correct_option_id || 
          currentQuestion.answer_options?.find(o => o.is_correct)?.id || 
          null
        );
      } else {
        setCorrectAnswerId(optId || null);
      }
    } catch (err: any) {
      alert(t('student.quiz.submitFailed'));
      setSelectedOptionId(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFeedback(null);
      setSelectedOptionId(null);
      setCorrectAnswerId(null);
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
      />

      <QuizQuestion 
        question={currentQuestion}
        selectedOptionId={selectedOptionId}
        correctAnswerId={correctAnswerId}
        feedback={feedback}
        submitting={submitting}
        onSelect={handleSelect}
      />

      <QuizFeedback 
        feedback={feedback}
        question={currentQuestion}
        onNext={handleNext}
      />

      <QuizOverlays 
        isTimeUp={isTimeUp}
        warnings={warnings}
        maxWarnings={maxWarnings}
        warningData={warningData}
        onDismissWarning={() => setWarningData(null)}
      />
    </div>
  );
};

export default StudentQuizFeature;

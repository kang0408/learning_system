import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAntiCheat } from '../../hooks/useAntiCheat';

interface AnswerOption {
  id: string;
  content: string;
  is_correct: boolean;
  order_index: number;
}

interface Question {
  id: string;
  question_type: string;
  content: string;
  topic?: string;
  explanation?: string;
  answer_options?: AnswerOption[];
}

interface Session {
  id: string;
  status: string;
  assignment_id?: string;
}

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctAnswerId, setCorrectAnswerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [warningData, setWarningData] = useState<{count: number, max: number} | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Đảm bảo handleFinishQuiz không bị thay đổi tham chiếu liên tục
  const handleFinishQuiz = useCallback(async () => {
    try {
      const finishRes = await api.post(`/api/sessions/${session?.id}/finish`);
      navigate('/session-result', { state: finishRes.data.data || finishRes.data });
    } catch (err: any) {
      alert('Error finishing session');
      navigate('/student');
    }
  }, [session?.id, navigate]);

  const { warnings, maxWarnings } = useAntiCheat({
    onForceSubmit: () => {
      // Khi vi phạm vượt giới hạn
      setWarningData(null);
      setIsTimeUp(true);
      setTimeout(() => {
        handleFinishQuiz();
      }, 2000);
    },
    onWarning: (count, max) => {
      setWarningData({ count, max });
    },
    enabled: !loading && !error && questions.length > 0 && !isTimeUp
  });

  useEffect(() => {
    if (!assignmentId) {
      setError('Please select an assignment to begin.');
      setLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        const payload = { assignment_id: assignmentId };
        const res = await api.post('/api/sessions', payload);

        const responseData = res.data.data || res.data;
        setSession({
          id: responseData.session_id,
          status: 'in_progress',
          assignment_id: assignmentId
        });
        if (responseData.time_limit_seconds) {
          setTimeLeft(responseData.time_limit_seconds);
        }
        setQuestions(responseData.questions || []);
        startTimeRef.current = Date.now();
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Error initializing session';
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, [assignmentId]);

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
  }, [timeLeft, submitting, feedback]);

  const currentQuestion = questions[currentIndex];

  const shuffledOptions = useMemo(() => {
    if (!currentQuestion?.answer_options) return [];
    if (currentQuestion.question_type === 'multiple_choice') {
      return [...currentQuestion.answer_options].sort(() => Math.random() - 0.5);
    }
    return currentQuestion.answer_options;
  }, [currentQuestion?.id]);

  if (loading) return <div className="h-screen bg-[#FDFBF7] flex items-center justify-center font-black text-4xl uppercase tracking-tighter animate-pulse text-indigo-600">Initializing...</div>;
  if (error) return <div className="h-screen bg-[#FDFBF7] flex items-center justify-center text-red-600 font-bold text-2xl uppercase tracking-widest">{error}</div>;
  if (questions.length === 0) return <div className="h-screen bg-[#FDFBF7] flex items-center justify-center text-zinc-400 font-black text-4xl uppercase tracking-tighter">No Questions</div>;

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

      const res = await api.post(`/api/sessions/${session?.id}/answers`, payload);

      const responseData = res.data.data || res.data;
      const isCorrect = responseData.is_correct;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      if (!isCorrect) {
        setCorrectAnswerId(responseData.correct_option_id || currentQuestion.answer_options?.find(o => o.is_correct)?.id || null);
      } else {
        setCorrectAnswerId(optId || null);
      }
    } catch (err: any) {
      alert('Submit failed, please try again.');
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

  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="h-screen w-full bg-[#FDFBF7] text-zinc-900 flex flex-col relative overflow-hidden font-sans selection:bg-indigo-600 selection:text-white select-none">

      {/* Stark Header Bar */}
      <div className="h-4 w-full bg-zinc-200">
        <div className="h-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center px-8 py-6 gap-6 md:gap-0">
        <div className="flex flex-wrap items-center gap-4 md:gap-8">
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to exit? Your current session progress will be lost.")) {
                navigate('/student');
              }
            }}
            className="flex items-center justify-center font-black uppercase tracking-widest text-xs md:text-sm text-zinc-900 border-2 border-zinc-900 px-4 py-2 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-[4px_4px_0_0_rgba(24,24,27,1)] hover:translate-y-1 hover:shadow-none"
          >
            Leave Quiz
          </button>
          <div className="font-mono font-black text-xl md:text-2xl text-indigo-600 bg-indigo-50 px-4 py-2 border-2 border-indigo-600">
            {String(currentIndex + 1).padStart(2, '0')} <span className="text-indigo-300">/</span> {String(questions.length).padStart(2, '0')}
          </div>
        </div>
        
        {timeLeft !== null && (
          <div className="flex gap-4">
            {warnings > 0 && (
              <div className="flex items-center font-bold text-sm md:text-base text-red-600 bg-red-50 border-2 border-red-600 px-4 py-2 shadow-[4px_4px_0_0_#dc2626]">
                ⚠️ Vi phạm: {warnings}/{maxWarnings}
              </div>
            )}
            <div className={`font-mono font-black text-2xl md:text-3xl bg-white border-2 px-4 py-2 transition-colors ${timeLeft < 60 ? 'text-red-600 border-red-600 animate-pulse shadow-[4px_4px_0_0_#dc2626]' : 'text-zinc-900 border-zinc-900 shadow-[4px_4px_0_0_rgba(24,24,27,1)]'}`}>
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {/* Main Content - High Impact Typography */}
      <div key={currentIndex} className="flex-1 w-full max-w-5xl mx-auto px-8 md:px-16 flex flex-col justify-center animate-in slide-in-from-right-8 fade-in duration-500 pb-16 pt-8 overflow-y-auto">

        {currentQuestion?.topic && (
          <div className="mb-6">
            <span className="font-bold uppercase tracking-[0.2em] text-indigo-600 text-xs bg-indigo-50 px-3 py-1.5 border-2 border-indigo-600">
              Topic // {currentQuestion.topic}
            </span>
          </div>
        )}

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-zinc-900 mb-8 leading-[1.2] tracking-tight w-full max-w-4xl border-l-6 border-indigo-600 pl-6 shrink-0">
          {currentQuestion?.content}
        </h2>

        <div className="grid grid-cols-1 gap-4 w-full max-w-4xl ml-auto pb-4">
          {shuffledOptions.map((opt) => {
            const isSelected = opt.id === selectedOptionId;
            const isCorrect = opt.id === correctAnswerId;

            let btnClass = 'border-4 border-zinc-900 bg-white text-zinc-900 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white';

            if (submitting && !feedback && isSelected) {
              btnClass = 'border-4 border-indigo-600 bg-indigo-600 text-white';
            }

            if (feedback) {
              if (isCorrect) {
                btnClass = 'border-4 border-green-600 bg-green-600 text-white';
              } else if (isSelected) {
                btnClass = 'border-4 border-red-600 bg-red-600 text-white line-through decoration-4';
              } else {
                btnClass = 'border-4 border-zinc-200 bg-white text-zinc-300 opacity-50';
              }
            }

            return (
              <button
                key={opt.id}
                disabled={!!feedback || submitting}
                onClick={() => handleSelect(opt.id)}
                className={`p-4 md:p-5 text-left font-black text-xl md:text-2xl uppercase tracking-tight transition-colors ${btnClass}`}
              >
                {opt.content}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Panel - Brutalist Slide-up */}
      <div className={`absolute bottom-0 left-0 w-full border-t-4 bg-[#FDFBF7] transition-transform duration-500 ease-out z-20 ${feedback ? 'translate-y-0' : 'translate-y-full'
        } ${feedback === 'correct' ? 'border-green-600' : 'border-red-600'}`}>
        <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1 max-h-[35vh] overflow-y-auto pr-4">
            <h3 className={`text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2 ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
              {feedback === 'correct' ? 'CORRECT' : 'INCORRECT'}
            </h3>

            {currentQuestion?.explanation && (
              <div className="mt-4 border-l-4 border-indigo-600 px-5 py-3 bg-indigo-50">
                <span className="font-bold uppercase tracking-widest text-indigo-600 text-xs block mb-1">Explanation</span>
                <p className="text-base md:text-lg font-medium leading-relaxed max-w-3xl text-zinc-900">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleNext}
            className="w-full md:w-auto px-10 py-5 font-black text-xl md:text-2xl uppercase tracking-tighter text-white bg-indigo-600 hover:bg-zinc-900 transition-colors whitespace-nowrap shrink-0 border-2 border-indigo-600 hover:border-zinc-900"
          >
            NEXT <span className="font-mono">→</span>
          </button>
        </div>
      </div>
      {/* Time Up or Force Submit Popup */}
      {isTimeUp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FDFBF7]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border-4 border-zinc-900 p-8 md:p-12 shadow-[8px_8px_0_0_#dc2626] max-w-lg w-[90%] text-center animate-in zoom-in-95 duration-300">
            <h2 className="text-4xl md:text-5xl font-black text-red-600 uppercase tracking-tighter mb-4">
              {warnings >= maxWarnings ? 'VI PHẠM QUÁ MỨC!' : 'HẾT GIỜ!'}
            </h2>
            <p className="text-xl font-bold text-zinc-900 uppercase tracking-tight">
              Hệ thống đang tự động nộp bài...
            </p>
          </div>
        </div>
      )}

      {/* Warning Popup */}
      {warningData && !isTimeUp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FDFBF7]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border-4 border-zinc-900 p-8 md:p-12 shadow-[8px_8px_0_0_#f59e0b] max-w-lg w-[90%] text-center animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl md:text-4xl font-black text-amber-500 uppercase tracking-tighter mb-4">
              CẢNH BÁO GIAN LẬN
            </h2>
            <p className="text-lg font-bold text-zinc-900 mb-6">
              Bạn vừa rời khỏi màn hình làm bài hoặc thu nhỏ trình duyệt.
            </p>
            <div className="mb-8 p-4 bg-amber-50 border-2 border-amber-500 font-mono font-bold text-amber-600">
              Vi phạm: {warningData.count} / {warningData.max} lần
            </div>
            <button
              onClick={() => setWarningData(null)}
              className="w-full px-8 py-4 font-black text-xl uppercase tracking-tighter text-zinc-900 bg-amber-400 border-2 border-zinc-900 hover:bg-zinc-900 hover:text-amber-400 transition-colors"
            >
              TÔI ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

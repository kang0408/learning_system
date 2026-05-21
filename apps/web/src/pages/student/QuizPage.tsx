import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, CheckCircle, XCircle, Loader2, ArrowLeft, Lightbulb } from 'lucide-react';
import api from '../../api/axios';

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
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!assignmentId) {
      setError('Vui lòng chọn bài tập từ Trang chủ để bắt đầu ôn tập.');
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
        const errorMessage = err.response?.data?.message 
          || err.response?.data?.error?.message 
          || err.response?.data?.error 
          || 'Lỗi khởi tạo bài học';
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
          handleFinishQuiz();
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
    // Shuffle only multiple choice questions to prevent position memorization
    if (currentQuestion.question_type === 'multiple_choice') {
      return [...currentQuestion.answer_options].sort(() => Math.random() - 0.5);
    }
    // Keep true/false in default order (Đúng first, Sai second)
    return currentQuestion.answer_options;
  }, [currentQuestion?.id]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-gray-500 font-medium">Đang chuẩn bị bài học...</p>
      </div>
    );
  }

  if (error) return <div className="h-screen flex items-center justify-center text-red-500 p-6 text-center">{error}</div>;
  if (questions.length === 0) return <div className="h-screen flex items-center justify-center text-gray-500">Không có câu hỏi nào cho bài tập này.</div>;

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
        // Backend returns correct_option_id or we find it from answer_options
        setCorrectAnswerId(responseData.correct_option_id || currentQuestion.answer_options?.find(o => o.is_correct)?.id || null);
      } else {
        setCorrectAnswerId(optId);
      }

      // Do not automatically move to next, wait for user to click Next
    } catch (err: any) {
      alert('Không thể nộp câu trả lời, vui lòng thử lại.');
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

  const handleFinishQuiz = async () => {
    try {
      const finishRes = await api.post(`/api/sessions/${session?.id}/finish`);
      navigate('/session-result', { state: finishRes.data.data || finishRes.data });
    } catch (err: any) {
      alert('Lỗi kết thúc bài học');
      navigate('/student');
    }
  };

  const confirmExit = () => {
    if (window.confirm('Bỏ dở? Tiến độ câu hiện tại sẽ không được lưu.')) {
      navigate('/student');
    }
  };

  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b bg-white shadow-sm z-10">
        <button onClick={confirmExit} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-full max-w-md mx-4 h-3 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <div className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
          <span className="font-bold text-slate-700">{currentIndex + 1}/{questions.length}</span>
          <button onClick={confirmExit} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors text-slate-500 hidden sm:block">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content - animate slide in */}
      <div key={currentIndex} className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center animate-in slide-in-from-right-8 fade-in duration-500 pb-32">
        {currentQuestion?.topic && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full uppercase tracking-wider">
              {currentQuestion.topic}
            </span>
          </div>
        )}
        
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 leading-snug">{currentQuestion?.content}</h2>
        
        <div className="space-y-4">
          {shuffledOptions.map((opt) => {
            const isSelected = opt.id === selectedOptionId;
              const isCorrect = opt.id === correctAnswerId;
              
              let btnClass = 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 bg-white';
              let Icon = null;
              
              // Optimistic UI while submitting
              if (submitting && !feedback && isSelected) {
                btnClass = 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200';
              }
              
              // Feedback state
              if (feedback) {
                if (isCorrect) {
                  btnClass = 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200 scale-[1.02]';
                  Icon = <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />;
                } else if (isSelected) {
                  btnClass = 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200';
                  Icon = <XCircle className="w-5 h-5 text-red-600 ml-auto" />;
                } else {
                  btnClass = 'border-slate-200 text-slate-400 opacity-50 bg-slate-50';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={!!feedback || submitting}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full p-4 md:p-5 rounded-xl border-2 text-left font-medium text-lg transition-all flex items-center shadow-sm ${btnClass}`}
                >
                  <span>{opt.content}</span>
                  {Icon}
                </button>
              );
            })}
        </div>
      </div>

      {/* Feedback Panel */}
      <div className={`absolute bottom-0 left-0 w-full p-6 bg-white border-t-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-out z-20 ${
        feedback ? 'translate-y-0' : 'translate-y-full'
      } ${feedback === 'correct' ? 'border-green-500' : 'border-red-500'}`}>
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {feedback === 'correct' ? (
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="bg-red-100 p-2 rounded-full">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              )}
              <h3 className={`text-2xl font-bold ${feedback === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                {feedback === 'correct' ? 'Chính xác!' : 'Chưa đúng'}
              </h3>
            </div>
            
            {currentQuestion?.explanation && (
              <div className="flex items-start gap-2 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 text-sm">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleNext}
            className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-white shadow-sm transition-transform active:scale-95 ${
              feedback === 'correct' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            TIẾP THEO
          </button>
        </div>
      </div>
    </div>
  );
}

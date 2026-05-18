import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';

interface Question {
  id: string;
  type: string;
  content: string;
  options?: any[];
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
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        const payload = assignmentId ? { assignment_id: assignmentId } : {};
        const res = await api.post('/api/sessions', payload);
        
        setSession(res.data.session);
        setQuestions(res.data.questions || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to start session');
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, [assignmentId]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (error) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (questions.length === 0) return <div className="h-screen flex items-center justify-center text-gray-500">No questions available for this session.</div>;

  const currentQuestion = questions[currentIndex];

  const handleSelect = async (optIndex: number) => {
    if (feedback || submitting) return;
    setSelectedOption(optIndex);
    setSubmitting(true);
    
    try {
      const res = await api.post(`/api/sessions/${session?.id}/answers`, {
        question_id: currentQuestion.id,
        answer: optIndex
      });
      
      const isCorrect = res.data.is_correct;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      if (!isCorrect) {
        setCorrectAnswer(res.data.correct_answer);
      }

      setTimeout(async () => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setFeedback(null);
          setSelectedOption(null);
          setCorrectAnswer(null);
        } else {
          try {
            const finishRes = await api.post(`/api/sessions/${session?.id}/finish`);
            navigate('/session-result', { state: finishRes.data });
          } catch (err: any) {
            alert('Failed to finish session');
            navigate('/student');
          }
        }
      }, 2000);
    } catch (err: any) {
      alert('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b bg-white">
        <button onClick={() => navigate('/student')} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <div className="w-full max-w-md mx-4 h-3 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="text-green-600 font-bold">{currentIndex + 1}/{questions.length}</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">{currentQuestion?.content}</h2>
        
        <div className="space-y-4">
          {currentQuestion?.options?.map((opt: any, idx: number) => {
            let btnClass = 'border-slate-200 hover:border-blue-500 hover:bg-slate-50 text-slate-700';
            
            if (feedback) {
              if (idx === selectedOption) {
                btnClass = feedback === 'correct' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-red-500 bg-red-50 text-red-700';
              } else if (idx === correctAnswer) {
                btnClass = 'border-green-500 bg-green-50 text-green-700';
              } else {
                btnClass = 'border-slate-200 text-slate-400 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                disabled={!!feedback || submitting}
                onClick={() => handleSelect(idx)}
                className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${btnClass}`}
              >
                {opt.text || opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Panel */}
      <div className={`absolute bottom-0 left-0 w-full p-6 bg-white border-t-2 transition-transform duration-300 ${
        feedback ? 'translate-y-0' : 'translate-y-full'
      } ${feedback === 'correct' ? 'border-green-500' : 'border-red-500'}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {feedback === 'correct' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
            <div>
              <h3 className={`text-xl font-bold ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                {feedback === 'correct' ? 'Excellent!' : 'Incorrect'}
              </h3>
            </div>
          </div>
          {submitting && <Loader2 className="w-6 h-6 animate-spin text-gray-400" />}
        </div>
      </div>
    </div>
  );
}

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function SessionResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('id');
  
  const [result, setResult] = useState<any>(location.state || null);
  const [loading, setLoading] = useState(!result && !!sessionId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!result && sessionId) {
      api.get(`/api/sessions/${sessionId}/result`)
        .then(res => {
          setResult(res.data.data || res.data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.response?.data?.message || err.message);
          setLoading(false);
        });
    } else if (!result && !sessionId) {
      navigate('/student');
    }
  }, [sessionId, result, navigate]);

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center font-black text-4xl uppercase tracking-tighter animate-pulse text-indigo-600">Loading Result...</div>;
  if (error) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-red-600 font-bold text-2xl uppercase tracking-widest">{error}</div>;
  if (!result) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-zinc-900 selection:bg-indigo-600 selection:text-white flex flex-col justify-center py-20 px-6 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Massive Score Typography */}
        <div className="text-center border-b-8 border-indigo-600 pb-16 mb-16 relative">
          <p className="text-xl md:text-2xl font-bold uppercase tracking-[0.3em] text-indigo-600 mb-8">Session Completed</p>
          <div className="text-[12rem] md:text-[18rem] leading-none font-black tracking-tighter relative inline-block text-zinc-900">
            {result.score || 0}
            <span className="text-[4rem] md:text-[6rem] absolute top-8 -right-16 md:-right-24 text-indigo-600">%</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
           <div>
             <p className="font-bold uppercase tracking-widest text-zinc-500 mb-2">Next Optimal Review</p>
             <p className="text-3xl font-black uppercase tracking-tighter">
               {result.next_review_date ? new Date(result.next_review_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'TOMORROW'}
             </p>
           </div>
           <button
            onClick={() => {
              if (searchParams.get('id')) {
                navigate(-1);
              } else {
                navigate('/student');
              }
            }}
            className="font-bold bg-indigo-600 text-white border-2 border-indigo-600 px-12 py-6 text-xl hover:bg-zinc-900 hover:border-zinc-900 transition-colors uppercase tracking-widest w-full md:w-auto text-center"
          >
            Continue
          </button>
        </div>

        {/* Detailed Answers Review - Brutalist Style */}
        {result.session_answers && result.session_answers.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">Detailed Review</h3>
            <div className="space-y-4">
              {result.session_answers.map((answer: any, index: number) => {
                const isCorrect = answer.is_correct;
                return (
                  <div key={answer.id} className={`border-4 p-6 md:p-8 ${isCorrect ? 'border-zinc-900 bg-white' : 'border-red-600 bg-red-50'}`}>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-black text-2xl md:text-3xl tracking-tight leading-snug">
                          <span className="text-indigo-600 mr-4 font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                          {answer.question.content}
                        </p>
                        <div className={`shrink-0 font-black uppercase tracking-widest px-3 py-1 border-2 ${isCorrect ? 'border-zinc-900 text-zinc-900' : 'border-red-600 text-red-600'}`}>
                          {isCorrect ? 'CORRECT' : 'INCORRECT'}
                        </div>
                      </div>
                      
                      {/* Options */}
                      {['multiple_choice', 'true_false'].includes(answer.question.question_type) && answer.question.answer_options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {answer.question.answer_options.map((opt: any) => {
                            const isSelected = answer.selected_option === opt.id;
                            const isOptCorrect = opt.is_correct;
                            
                            let boxClass = "p-4 border-2 font-bold text-lg ";
                            if (isOptCorrect) {
                              boxClass += "border-green-600 bg-green-100 text-green-900";
                            } else if (isSelected && !isOptCorrect) {
                              boxClass += "border-red-600 bg-red-600 text-white";
                            } else {
                              boxClass += "border-zinc-200 text-zinc-400";
                            }

                            return (
                              <div key={opt.id} className={boxClass}>
                                {opt.content}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!['multiple_choice', 'true_false'].includes(answer.question.question_type) && (
                        <div className="mt-4 p-4 border-2 border-indigo-600 font-mono text-lg font-bold bg-indigo-50">
                           <span className="text-indigo-600 uppercase tracking-widest text-sm block mb-2">Your Answer</span> 
                           <span className={isCorrect ? 'text-zinc-900' : 'text-red-600'}>
                             {answer.text_answer || '(No answer)'}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

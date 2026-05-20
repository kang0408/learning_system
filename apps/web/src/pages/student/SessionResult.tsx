import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, ArrowRight, Trophy, Loader2, AlertCircle } from 'lucide-react';
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 flex-col"><AlertCircle className="w-10 h-10 mb-2" /> {error}</div>;
  if (!result) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden text-center my-8">
        <div className="bg-gradient-to-br from-green-400 to-green-600 py-10 px-6">
          <Trophy className="w-20 h-20 text-white mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">Session Complete!</h2>
          <p className="text-green-100 mt-2">Great job staying consistent.</p>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-sm text-slate-500 font-medium mb-1">Score</div>
              <div className="text-2xl font-bold text-slate-800">{result.score || 0}%</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-sm text-slate-500 font-medium mb-1">Items Learned</div>
              <div className="text-2xl font-bold text-slate-800">{result.total_questions || result.total_q || 0}</div>
            </div>
          </div>
          
          <div className="bg-blue-50 text-blue-800 rounded-xl p-4 mb-8 flex items-start text-left">
            <Calendar className="w-6 h-6 text-blue-500 mr-3 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Next Review</h4>
              <p className="text-sm text-blue-600 mt-1">
                {result.next_review_date ? new Date(result.next_review_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Tomorrow'}
              </p>
            </div>
          </div>

          {result.session_answers && result.session_answers.length > 0 && (
            <div className="mt-8 text-left border-t pt-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Chi tiết làm bài</h3>
              <div className="space-y-6">
                {result.session_answers.map((ans: any, idx: number) => {
                  const q = ans.question;
                  const selectedOpt = q.answer_options?.find((o: any) => o.id === ans.selected_option);
                  const correctOpt = q.answer_options?.find((o: any) => o.is_correct);

                  return (
                    <div key={ans.id} className={`p-5 rounded-xl border ${ans.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex gap-3 items-start mb-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${ans.is_correct ? 'bg-green-500' : 'bg-red-500'}`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800">{q.content}</p>
                        </div>
                      </div>
                      
                      <div className="ml-11 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 font-medium min-w-[100px]">Đã chọn:</span>
                          <span className={`font-semibold ${ans.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                            {ans.text_answer ? (
                              `"${ans.text_answer}"`
                            ) : selectedOpt ? (
                              selectedOpt.content
                            ) : (
                              <span className="italic text-gray-400">Không trả lời</span>
                            )}
                          </span>
                        </div>
                        {!ans.is_correct && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 font-medium min-w-[100px]">Đáp án đúng:</span>
                            <span className="font-semibold text-green-700">{correctOpt?.content}</span>
                          </div>
                        )}
                        {q.explanation && (
                          <div className="mt-3 text-slate-600 bg-white/60 p-3 rounded-lg border border-slate-200">
                            <span className="font-semibold block mb-1">Giải thích:</span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}



          <button
            onClick={() => navigate('/student')}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}

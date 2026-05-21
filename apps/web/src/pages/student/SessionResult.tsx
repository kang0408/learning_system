import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 flex-col bg-white"><AlertCircle className="w-12 h-12 mb-4" /> <p className="font-bold text-lg">{error}</p></div>;
  if (!result) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-700">
      <div className="max-w-lg w-full text-center space-y-12">
        
        {/* Header */}
        <div className="space-y-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">Hoàn thành!</h1>
          <p className="text-xl text-gray-500 font-medium">Bạn đã hoàn thành phiên ôn tập này.</p>
        </div>

        {/* Score */}
        <div className="py-12 border-y border-gray-100">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Điểm số</div>
          <div className="text-7xl font-black text-blue-600 tracking-tighter">
            {result.score || 0}<span className="text-4xl text-gray-300 ml-1">%</span>
          </div>
        </div>

        {/* Action */}
        <div className="pt-4 space-y-4">
          <button
            onClick={() => navigate('/student')}
            className="w-full flex items-center justify-center py-5 px-6 rounded-2xl text-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
          >
            Trở về trang chủ
            <ArrowRight className="w-6 h-6 ml-2" />
          </button>
          
          <div className="flex items-center justify-center text-sm font-bold text-gray-400">
            <Calendar className="w-4 h-4 mr-2" />
            Lần ôn tiếp theo: {result.next_review_date ? new Date(result.next_review_date).toLocaleDateString('vi-VN') : 'Ngày mai'}
          </div>
        </div>

      </div>
    </div>
  );
}

import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Trophy } from 'lucide-react';

export default function SessionResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state || {};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden text-center">
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
              <div className="text-2xl font-bold text-slate-800">{result.total_items || 0}</div>
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

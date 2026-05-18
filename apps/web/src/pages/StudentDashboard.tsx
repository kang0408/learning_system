import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Calendar, Clock, Trophy, Loader2, ArrowRight } from 'lucide-react';
import api from '../api/axios';

interface Analytics {
  due_today: number;
  total_learned: number;
  accuracy: number;
}

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  status: string;
  total_questions: number;
}

export default function StudentDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, assignmentsRes] = await Promise.all([
          api.get('/api/analytics/student/me'),
          api.get('/api/assignments/my')
        ]);
        setAnalytics(analyticsRes.data);
        setAssignments(assignmentsRes.data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 sm:p-10 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {analytics?.due_today || 0} items to review
            </h2>
            <p className="text-blue-100 mb-6">Stay on top of your learning goals today.</p>
            <Link 
              to="/quiz" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Brain className="w-5 h-5 mr-2" />
              Start Review Session
            </Link>
          </div>
          <div className="hidden sm:block">
            <Trophy className="w-32 h-32 text-blue-200 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Progress</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center text-gray-600">
                <Brain className="w-5 h-5 mr-3 text-blue-500" />
                Total Items Learned
              </div>
              <span className="font-bold text-gray-900">{analytics?.total_learned || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-gray-600">
                <Trophy className="w-5 h-5 mr-3 text-yellow-500" />
                Average Accuracy
              </div>
              <span className="font-bold text-gray-900">{analytics?.accuracy || 0}%</span>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">My Assignments</h3>
            <Link to="/student/classes" className="text-blue-600 text-sm hover:underline flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map(assignment => (
                <Link key={assignment.id} to={`/quiz?assignment=${assignment.id}`} className="block group">
                  <div className="flex items-center justify-between p-3 rounded-lg border group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-700">{assignment.title}</h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        Due {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              <Calendar className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p>No pending assignments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

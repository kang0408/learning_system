import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Trophy, BarChart2 } from 'lucide-react';
import api from '../api/axios';

interface StudentStat {
  student_id: string;
  name: string;
  score: number;
}

interface TopicStat {
  topic: string;
  accuracy: number;
}

interface ClassAnalytics {
  leaderboard: StudentStat[];
  topic_accuracy: TopicStat[];
}

export default function TeacherClassDetail() {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/api/analytics/class/${id}`);
        setAnalytics(res.data);
      } catch (err) {
        setError('Failed to load class analytics');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAnalytics();
  }, [id]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link to="/teacher" className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Class Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Leaderboard
          </h2>
          {analytics?.leaderboard && analytics.leaderboard.length > 0 ? (
            <ul className="space-y-4">
              {analytics.leaderboard.map((student, index) => (
                <li key={student.student_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{student.name}</span>
                  </div>
                  <span className="font-bold text-gray-700">{student.score} pts</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-500 py-8">No student data available.</div>
          )}
        </div>

        {/* Topic Accuracy */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-purple-500" /> Topic Accuracy
          </h2>
          {analytics?.topic_accuracy && analytics.topic_accuracy.length > 0 ? (
            <div className="space-y-6">
              {analytics.topic_accuracy.map(topic => (
                <div key={topic.topic}>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-gray-700">{topic.topic}</span>
                    <span className={topic.accuracy > 70 ? 'text-green-600' : topic.accuracy > 40 ? 'text-yellow-600' : 'text-red-600'}>
                      {topic.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${topic.accuracy > 70 ? 'bg-green-500' : topic.accuracy > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${topic.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No topic data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

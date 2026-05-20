import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Trophy, BarChart2, Users, FileText, Plus } from 'lucide-react';
import api from '../../api/axios';

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
  const [classDetails, setClassDetails] = useState<any>(null);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, statsRes, topicsRes, studentsRes, membersRes, assignRes] = await Promise.all([
          api.get(`/api/classes/${id}`),
          api.get(`/api/analytics/class/${id}`),
          api.get(`/api/analytics/class/${id}/topics`),
          api.get(`/api/analytics/class/${id}/students`),
          api.get(`/api/classes/${id}/members`),
          api.get(`/api/assignments?class_id=${id}`)
        ]);
        setClassDetails(classRes.data.data);
        
        const rawTopics = topicsRes.data.data || [];
        const topics = rawTopics.map((t: any) => ({
          topic: t.topic,
          accuracy: Number(t.accuracy_pct || 0)
        }));
        
        const students = studentsRes.data.data || [];
        
        setAnalytics({
          leaderboard: students,
          topic_accuracy: topics
        });
        
        setMembers(membersRes.data.data || []);
        setAssignments(assignRes.data.data || []);
      } catch (err) {
        setError('Failed to load class details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center mb-4 md:mb-0">
          <Link to="/teacher" className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classDetails?.name}</h1>
            <p className="text-gray-500">{classDetails?.subject} • Mã tham gia: <span className="font-semibold text-purple-600">{classDetails?.join_code}</span></p>
          </div>
        </div>
        <Link 
          to={`/teacher/classes/${id}/assignments/new`}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" /> Giao bài tập
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Members & Assignments */}
        <div className="lg:col-span-1 space-y-6">
          <Link to={`/teacher/classes/${id}/members`} className="block bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" /> Học sinh ({members.length})
            </h2>
            <p className="text-sm text-gray-500">Xem danh sách và quản lý thành viên</p>
          </Link>

          <Link to={`/teacher/classes/${id}/assignments`} className="block bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-500" /> Bài tập ({assignments.length})
            </h2>
            <p className="text-sm text-gray-500">Xem danh sách, điểm số và quản lý bài tập</p>
          </Link>
        </div>

        {/* Right Column: Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Bảng xếp hạng điểm số
            </h2>
            {analytics?.leaderboard && analytics.leaderboard.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.leaderboard.map((student, index) => (
                  <li key={student.student_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
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
              <div className="text-center text-gray-500 py-4">Chưa có dữ liệu học sinh.</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-purple-500" /> Độ chính xác theo chủ đề
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
              <div className="text-center text-gray-500 py-4">Chưa có dữ liệu chủ đề.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

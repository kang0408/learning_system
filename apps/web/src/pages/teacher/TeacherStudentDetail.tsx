import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, BarChart2, BookOpen, Target, CheckCircle, Clock, Flame } from 'lucide-react';
import api from '../../api/axios';

export default function TeacherStudentDetail() {
  const { id, studentId } = useParams<{ id: string, studentId: string }>();
  const [stats, setStats] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [statsRes, assignRes] = await Promise.all([
          api.get(`/api/analytics/student/${studentId}`),
          api.get(`/api/assignments?class_id=${id}&student_id=${studentId}`)
        ]);
        setStats(statsRes.data.data);
        setAssignments(assignRes.data.data || []);
      } catch (err) {
        setError('Failed to load student details');
      } finally {
        setLoading(false);
      }
    };
    if (id && studentId) fetchDetail();
  }, [id, studentId]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center bg-white p-6 rounded-xl shadow-sm border">
        <Link to={`/teacher/classes/${id}/members`} className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            Chi tiết Học sinh
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-purple-600 font-medium text-sm mb-1">Số buổi học</p>
              <p className="text-2xl font-bold text-purple-900">{stats?.total_sessions || 0}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-600 font-medium text-sm mb-1">Câu hỏi làm</p>
              <p className="text-2xl font-bold text-blue-900">{stats?.total_questions_answered || 0}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-green-600 font-medium text-sm mb-1">Độ chính xác</p>
              <p className="text-2xl font-bold text-green-900">{stats?.overall_accuracy?.toFixed(1) || 0}%</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-orange-600 font-medium text-sm mb-1">Chuỗi ngày</p>
              <p className="text-2xl font-bold text-orange-900 flex items-center justify-center gap-1">
                {stats?.current_streak_days || 0}
                <Flame className="w-5 h-5 text-orange-500" />
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-red-500" /> Điểm yếu cần khắc phục (Tỷ lệ đúng &lt; 60%)
            </h2>
            {stats?.weak_topics && stats.weak_topics.length > 0 ? (
              <div className="space-y-4">
                {stats.weak_topics.map((t: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className="text-gray-700">{t.topic}</span>
                      <span className="text-red-600">{t.accuracy_pct?.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${t.accuracy_pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Học sinh không có chủ đề yếu nào.</p>
            )}
          </div>
        </div>

        {/* Assignments List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-green-500" /> Bài tập đã nhận ({assignments.length})
            </h2>
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {assignments.map((a: any) => (
                <li key={a.id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Hạn chót: {a.deadline ? new Date(a.deadline).toLocaleDateString() : 'Không có'}</p>
                    <p className="flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> {a.is_all_students ? 'Giao cho cả lớp' : 'Giao cá nhân'}</p>
                  </div>
                </li>
              ))}
              {assignments.length === 0 && (
                <p className="text-center text-gray-500 py-4">Chưa có bài tập nào.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

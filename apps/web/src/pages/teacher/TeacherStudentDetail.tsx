import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, BarChart2, BookOpen, Target, CheckCircle, Clock, Flame } from 'lucide-react';
import api from '../../api/axios';

export default function TeacherStudentDetail() {
  const { id, studentId } = useParams<{ id: string, studentId: string }>();
  const [stats, setStats] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [statsRes, assignRes, membersRes] = await Promise.all([
          api.get(`/api/analytics/student/${studentId}`),
          api.get(`/api/assignments?class_id=${id}&student_id=${studentId}`),
          api.get(`/api/classes/${id}/members?limit=1000`)
        ]);

        setStats(statsRes.data.data);
        setAssignments(assignRes.data.data || []);

        // Find student info
        const members = membersRes.data.data || [];
        const currentStudent = members.find((m: any) => m.student_id === studentId);
        if (currentStudent) {
          setStudentInfo(currentStudent.student);
        }
      } catch (err) {
        setError('Failed to load student details');
      } finally {
        setLoading(false);
      }
    };
    if (id && studentId) fetchDetail();
  }, [id, studentId]);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      <p className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu học sinh...</p>
    </div>
  );
  if (error) return (
    <div className="max-w-md mx-auto my-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm">
      <h3 className="text-lg font-bold text-red-800 mb-2">Đã xảy ra lỗi</h3>
      <p className="text-red-600 mb-4">{error}</p>
      <Link to={`/teacher/classes/${id}`} className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition">
        <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại
      </Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header card with rich colors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition duration-300">
        <div className="flex items-center mb-4 md:mb-0">
          <Link to={`/teacher/classes/${id}`} className="mr-5 p-2 rounded-full hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4">
            {studentInfo ? (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-xl shadow-sm">
                {studentInfo.full_name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xl">
                ?
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  {studentInfo ? studentInfo.full_name : 'Chi tiết Học sinh'}
                </h1>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  Học viên
                </span>
              </div>
              {studentInfo?.email && (
                <p className="text-sm text-gray-500 mt-1">{studentInfo.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition">
              <p className="text-purple-600 font-bold text-sm mb-1 uppercase tracking-wide">Số lượt làm bài</p>
              <p className="text-3xl font-extrabold text-gray-900">{stats?.total_sessions || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition">
              <p className="text-blue-600 font-bold text-sm mb-1 uppercase tracking-wide">Câu hỏi làm</p>
              <p className="text-3xl font-extrabold text-gray-900">{stats?.total_questions_answered || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition">
              <p className="text-green-600 font-bold text-sm mb-1 uppercase tracking-wide">Độ chính xác</p>
              <p className="text-3xl font-extrabold text-gray-900">{stats?.overall_accuracy?.toFixed(1) || 0}%</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition">
              <p className="text-orange-600 font-bold text-sm mb-1 uppercase tracking-wide">Chuỗi ngày</p>
              <p className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-1.5">
                {stats?.current_streak_days || 0}
                <Flame className="w-6 h-6 text-orange-500" />
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" /> Điểm yếu cần khắc phục
              </h2>
              <p className="text-sm text-gray-500 mt-1">Các chủ đề có tỷ lệ chính xác dưới 60%</p>
            </div>
            <div className="p-6">
              {stats?.weak_topics && stats.weak_topics.length > 0 ? (
                <div className="space-y-5">
                  {stats.weak_topics.map((t: any, idx: number) => (
                    <div key={idx} className="group">
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-gray-800">{t.topic}</span>
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{t.accuracy_pct?.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full transition-all duration-500 group-hover:scale-y-110"
                          style={{ width: `${t.accuracy_pct}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-gray-600 font-medium">Học sinh không có chủ đề yếu nào.</p>
                  <p className="text-sm text-gray-400 mt-1">Tuyệt vời! Học sinh đang nắm vững các kiến thức cơ bản.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" /> Bài tập đã nhận
              </h2>
              <p className="text-sm text-gray-500 mt-1">Tổng cộng: {assignments.length} bài tập</p>
            </div>
            <div className="p-0 max-h-[600px] overflow-y-auto">
              <ul className="divide-y divide-gray-100">
                {assignments.map((a: any) => {
                  const isOverdue = a.student_status === 'pending' && a.deadline && new Date(a.deadline) < new Date();
                  
                  return (
                    <li key={a.id} className="p-5 hover:bg-gray-50/80 transition duration-150">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-900 text-base">{a.title}</p>
                        {a.student_status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành ({a.student_score} pts)
                          </span>
                        ) : a.student_status === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Đang làm
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-full">
                            <Target className="w-3.5 h-3.5" /> Quá hạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 text-xs font-bold rounded-full">
                            <BookOpen className="w-3.5 h-3.5" /> Chưa làm
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="flex items-center text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          Hạn chót: {a.deadline ? new Date(a.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                        </div>
                        <div className="flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          {a.is_all_students ? 'Giao cho cả lớp' : 'Giao cá nhân'}
                        </div>
                      </div>
                    </li>
                  );
                })}
                {assignments.length === 0 && (
                  <div className="text-center py-12 px-4">
                    <p className="text-gray-500 font-medium">Chưa có bài tập nào.</p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

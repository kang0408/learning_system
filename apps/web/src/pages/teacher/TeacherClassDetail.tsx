import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, ArrowLeft, Trophy, BarChart2, Users, Plus,
  ArrowUpRight, ArrowDownRight, Award, Calendar, CheckCircle2,
  AlertCircle, GraduationCap, Percent, BookOpen, X, Clock, Edit, Trash2, Send, EyeOff
} from 'lucide-react';
import api from '../../api/axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StudentStat {
  student_id: string;
  name: string;
  score: number;
  sessions_count?: number;
  accuracy?: number;
  last_active_at?: string;
}

interface TopicStat {
  topic_id: string;
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
  const [classStats, setClassStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tabs State
  const [activeTab, setActiveTab] = useState<'analytics' | 'students' | 'assignments'>('analytics');

  // Modal State for topic drill-down
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; name: string } | null>(null);
  const [topicStudents, setTopicStudents] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

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
        setClassStats(statsRes.data.data);

        const rawTopics = topicsRes.data.data || [];
        const topics = rawTopics.map((t: any) => ({
          topic_id: t.topic_id,
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
        setError('Không thể tải thông tin lớp học này.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleChartClick = async (topicId: string, topicName: string) => {
    setSelectedTopic({ id: topicId, name: topicName });
    setShowTopicModal(true);
    setModalLoading(true);
    try {
      const res = await api.get(`/api/analytics/class/${id}/topics/${topicId}/students`);
      setTopicStudents(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết học sinh theo chủ đề:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa hoạt động';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài tập này? Mọi dữ liệu làm bài của học sinh sẽ bị xóa.')) return;
    try {
      await api.delete(`/api/assignments/${assignmentId}`);
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa bài tập');
    }
  };

  const handleTogglePublish = async (assignmentId: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        await api.post(`/api/assignments/${assignmentId}/unpublish`);
      } else {
        await api.post(`/api/assignments/${assignmentId}/publish`);
      }
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId ? { ...a, is_published: !isPublished } : a
      ));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái phát hành');
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa học sinh ${studentName} khỏi lớp?`)) return;
    try {
      await api.delete(`/api/classes/${id}/members/${studentId}`);
      setAnalytics(prev => prev ? {
        ...prev,
        leaderboard: prev.leaderboard.filter(s => s.student_id !== studentId)
      } : null);
      setMembers(prev => prev.filter((m: any) => m.student_id !== studentId));
      if (classStats) {
        setClassStats((prev: any) => ({
          ...prev,
          total_students: Math.max(0, (prev.total_students || 1) - 1),
          active_students: {
             ...prev.active_students, 
             current: Math.max(0, (prev.active_students?.current || 1) - 1) 
          }
        }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa học sinh');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-slate-900" />
        <p className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu lớp học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-800 mb-2">Đã xảy ra lỗi</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/teacher" className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition">
          <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại bảng điều khiển
        </Link>
      </div>
    );
  }

  // Setup topic accuracy chart options and data
  const sortedTopics = analytics?.topic_accuracy ? [...analytics.topic_accuracy].sort((a, b) => b.accuracy - a.accuracy) : [];
  const chartData = {
    labels: sortedTopics.map(t => t.topic),
    datasets: [{
      label: 'Tỷ lệ chính xác (%)',
      data: sortedTopics.map(t => t.accuracy),
      backgroundColor: sortedTopics.map(t =>
        t.accuracy >= 70 ? 'rgba(16, 185, 129, 0.85)' :
          t.accuracy >= 40 ? 'rgba(245, 158, 11, 0.85)' :
            'rgba(239, 68, 68, 0.85)'
      ),
      borderColor: sortedTopics.map(t =>
        t.accuracy >= 70 ? 'rgb(16, 185, 129)' :
          t.accuracy >= 40 ? 'rgb(245, 158, 11)' :
            'rgb(239, 68, 68)'
      ),
      borderWidth: 1.5,
      borderRadius: 6,
      barThickness: 24,
    }]
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` Tỷ lệ chính xác: ${context.raw}%`
        },
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleFont: { size: 13, weight: 'bold' as const },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(243, 244, 246, 0.8)' },
        ticks: { font: { family: 'Inter', size: 12 }, color: '#6b7280' }
      },
      y: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 12, weight: 'bold' as const }, color: '#374151' }
      }
    },
    onClick: (_event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const topic = sortedTopics[index];
        handleChartClick(topic.topic_id, topic.topic);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">

      {/* Header card with rich colors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition duration-300">
        <div className="flex items-center mb-4 md:mb-0">
          <Link to="/teacher" className="mr-5 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{classDetails?.name}</h1>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-900 text-xs font-semibold rounded-full border border-slate-200">
                {classDetails?.subject}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <span>Mã tham gia lớp học:</span>
              <span className="font-bold text-slate-900 bg-slate-100/50 px-2 py-0.5 rounded border border-slate-200/50 select-all cursor-pointer">
                {classDetails?.join_code}
              </span>
            </p>
          </div>
        </div>
        {/* <Link 
          to={`/teacher/classes/${id}/assignments/new`}
          className="flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition duration-300 shadow-sm border border-slate-900"
        >
          <Plus className="w-5 h-5 mr-2" /> Giao bài tập mới
        </Link> */}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white p-2 rounded-xl shadow-sm border border-gray-100 gap-1.5">
        {(['analytics', 'students', 'assignments'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm transition-all duration-300 flex-1 md:flex-initial ${activeTab === tab
                ? 'bg-purple-600 text-white shadow-md shadow-slate-100'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
          >
            {tab === 'analytics' && <BarChart2 className="w-4 h-4" />}
            {tab === 'students' && <GraduationCap className="w-4 h-4" />}
            {tab === 'assignments' && <BookOpen className="w-4 h-4" />}
            {tab === 'analytics' ? 'Phân tích' : tab === 'students' ? 'Thành viên' : 'Bài tập'}
          </button>
        ))}
      </div>

      {/* Conditional Rendering of Tabs */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Students Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition duration-300 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">Tổng số học sinh</p>
                <h3 className="text-3xl font-bold tracking-tight text-gray-900 mt-2">{classStats?.total_students || 0}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Active Students Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition duration-300 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">Hoạt động tuần này</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-bold tracking-tight text-gray-900">{classStats?.active_students?.current || 0}</h3>
                  {classStats?.active_students && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold ${classStats.active_students.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                      {classStats.active_students.trend === 'up' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                      )}
                      {classStats.active_students.trend === 'up' ? 'Tăng' : 'Giảm'}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-slate-100 text-slate-900 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
            </div>

            {/* Completion Rate Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition duration-300 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">Tỷ lệ nộp bài</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-bold tracking-tight text-gray-900">{classStats?.completion_rate?.current || 0}%</h3>
                  {classStats?.completion_rate && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold ${classStats.completion_rate.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                      {classStats.completion_rate.trend === 'up' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                      )}
                      {classStats.completion_rate.trend === 'up' ? 'Tăng' : 'Giảm'}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Percent className="w-6 h-6" />
              </div>
            </div>

            {/* Average Score Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition duration-300 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">Điểm trung bình</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-bold tracking-tight text-gray-900">{classStats?.average_score?.current || 0} pts</h3>
                  {classStats?.average_score && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold ${classStats.average_score.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                      {classStats.average_score.trend === 'up' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                      )}
                      {classStats.average_score.trend === 'up' ? 'Tăng' : 'Giảm'}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* SM2 Memory Status Overview */}
          {classStats?.sm2_summary && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-purple-600" /> Trạng thái trí nhớ SM2 của lớp
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Tổng quan quá trình ghi nhớ kiến thức của toàn bộ học sinh trong lớp (tổng {classStats.sm2_summary.total_questions} lượt hỏi).
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-500">Cần ôn tập hôm nay</div>
                  <div className="text-2xl font-bold text-red-600">{classStats.sm2_summary.due_today} câu</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mastered */}
                <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="text-emerald-700 text-sm font-bold flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Đã thành thạo (Mastered)
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-900 mb-1">
                    {Math.round(classStats.sm2_summary.mastered.pct)}%
                  </div>
                  <div className="text-sm text-emerald-600 font-medium">
                    {classStats.sm2_summary.mastered.count} câu hỏi
                  </div>
                </div>

                {/* Learning */}
                <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="text-blue-700 text-sm font-bold flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4" /> Đang học (Learning)
                  </div>
                  <div className="text-3xl font-extrabold text-blue-900 mb-1">
                    {Math.round(classStats.sm2_summary.learning.pct)}%
                  </div>
                  <div className="text-sm text-blue-600 font-medium flex justify-between">
                    <span>Tổng: {classStats.sm2_summary.learning.count}</span>
                    <span className="text-red-500 font-bold" title="Sắp quên">Nguy cơ: {classStats.sm2_summary.learning.at_risk}</span>
                  </div>
                </div>

                {/* New */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-600 text-sm font-bold flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4" /> Kiến thức mới (New)
                  </div>
                  <div className="text-3xl font-extrabold text-slate-800 mb-1">
                    {Math.round(classStats.sm2_summary.new.pct)}%
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    {classStats.sm2_summary.new.count} câu hỏi
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${classStats.sm2_summary.mastered.pct}%` }} title={`Thành thạo: ${Math.round(classStats.sm2_summary.mastered.pct)}%`}></div>
                <div className="h-full bg-blue-500" style={{ width: `${classStats.sm2_summary.learning.pct}%` }} title={`Đang học: ${Math.round(classStats.sm2_summary.learning.pct)}%`}></div>
                <div className="h-full bg-slate-300" style={{ width: `${classStats.sm2_summary.new.pct}%` }} title={`Mới: ${Math.round(classStats.sm2_summary.new.pct)}%`}></div>
              </div>
            </div>
          )}

          {/* Chart Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-slate-900" /> Tỷ lệ chính xác theo chủ đề
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Biểu thị tỷ lệ trả lời đúng trung bình của lớp học theo các chủ đề. Click vào thanh biểu đồ để xem chi tiết học sinh.
              </p>
            </div>
            {sortedTopics.length > 0 ? (
              <div className="h-[360px] relative">
                <Bar data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                Chưa có dữ liệu thống kê chủ đề cho lớp học này.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-slate-900" /> Danh sách học tập và xếp hạng
              </h2>
              <p className="text-sm text-gray-500 mt-1">Thống kê điểm số tích lũy, số lượt nộp bài, tỷ lệ chính xác và thời gian hoạt động của học sinh.</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-900 text-sm font-semibold rounded-full border border-slate-200">
              Tổng số: {members.length} học sinh
            </span>
          </div>

          {analytics?.leaderboard && analytics.leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50/50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-center w-16">Thứ hạng</th>
                    <th className="px-6 py-3.5 text-left">Học sinh</th>
                    <th className="px-6 py-3.5 text-left">Điểm tích lũy</th>
                    <th className="px-6 py-3.5 text-center">Độ chính xác</th>
                    <th className="px-6 py-3.5 text-center">Tiến độ SM2</th>
                    <th className="px-6 py-3.5 text-left">Hoạt động cuối cùng</th>
                    <th className="px-6 py-3.5 text-right w-32">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-gray-700 font-medium">
                  {analytics.leaderboard.map((student: any, index) => {
                    const isTop3 = index < 3;
                    return (
                      <tr key={student.student_id} className="hover:bg-gray-50/80 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isTop3 ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                index === 1 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                  'bg-orange-100 text-orange-700 border border-orange-200'
                              }`}>
                              {index + 1}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-semibold">{index + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center font-bold mr-3">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold flex items-center gap-1 mt-1">
                          <Trophy className="w-4 h-4 text-amber-500" /> {student.score} pts
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${(student.accuracy || 0) >= 75 ? 'bg-green-50 text-green-700 border-green-200' :
                              (student.accuracy || 0) >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {student.accuracy || 0}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold text-gray-900" title="Đã thành thạo / Tổng số câu đã học">
                              {student.sm2_mastered_q || 0} / {student.sm2_total_q || 0} câu
                            </span>
                            {student.sm2_avg_ef && (
                              <span className="text-gray-500 font-medium" title="Độ trôi chảy (Avg Easiness Factor)">
                                EF: {Number(student.sm2_avg_ef).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                          {formatDate(student.last_active_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/teacher/classes/${id}/members/${student.student_id}`}
                              className="px-3 py-1.5 bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-lg transition font-semibold text-sm inline-flex items-center border border-slate-200"
                            >
                              Chi tiết
                            </Link>
                            <button
                              onClick={() => handleRemoveStudent(student.student_id, student.name)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                              title={`Xóa ${student.name} khỏi lớp`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 bg-gray-50/50">
              Lớp học chưa có thành viên học sinh hoặc chưa có dữ liệu nộp bài.
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-900" /> Quản lý bài tập giao cho lớp
              </h2>
              <p className="text-sm text-gray-500 mt-1">Danh sách các bài tập đã giao, theo dõi tỷ lệ nộp bài, điểm số trung bình lớp và hạn chót.</p>
            </div>
            <Link
              to={`/teacher/classes/${id}/assignments/new`}
              className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Tạo bài tập mới
            </Link>
          </div>

          {assignments && assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50/50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Bài tập</th>
                    <th className="px-6 py-3.5 text-left">Hình thức</th>
                    <th className="px-6 py-3.5 text-left w-56">Tiến độ nộp bài</th>
                    <th className="px-6 py-3.5 text-center">Điểm trung bình lớp</th>
                    <th className="px-6 py-3.5 text-left">Hạn chót</th>
                    <th className="px-6 py-3.5 text-center">Trạng thái</th>
                    <th className="px-6 py-3.5 text-right w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-gray-700 font-medium">
                  {assignments.map(assignment => {
                    const submittedCount = assignment.submitted_count || 0;
                    const totalStudents = assignment.total_students || classStats?.total_students || members.length || 1;
                    const submissionRate = assignment.submission_rate || 0;
                    const avgScore = assignment.avg_score || 0;
                    const status = assignment.status || 'ongoing';
                    const deadlineDate = assignment.deadline ? new Date(assignment.deadline) : null;

                    return (
                      <tr key={assignment.id} className="hover:bg-gray-50/80 transition duration-150">
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-semibold text-gray-900 text-base">{assignment.title}</span>
                            {assignment.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{assignment.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            assignment.mode === 'standard' ? 'bg-slate-100 text-slate-900 border-slate-200' : 
                            assignment.mode === 'adaptive' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {assignment.mode === 'standard' ? 'Luyện tập' : assignment.mode === 'adaptive' ? 'Thích ứng' : 'Thi cử'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-gray-500 font-semibold">
                              <span>Tiến độ: {submittedCount}/{totalStudents} học sinh</span>
                              <span>{submissionRate}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${status === 'completed' ? 'bg-green-500' : 'bg-slate-1000'
                                  }`}
                                style={{ width: `${submissionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-950 font-bold">
                          {avgScore > 0 ? (
                            <span className="flex items-center justify-center gap-1">
                              <Award className="w-4 h-4 text-slate-900" /> {avgScore} pts
                            </span>
                          ) : (
                            <span className="text-gray-400 font-normal">--</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                          {deadlineDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{deadlineDate.toLocaleDateString('vi-VN')}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Không có hạn</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center flex flex-col items-center gap-1">
                          <div>
                            {status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                              </span>
                            ) : status === 'overdue' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-full">
                                <AlertCircle className="w-3.5 h-3.5" /> Quá hạn
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold rounded-full">
                                <Clock className="w-3.5 h-3.5" /> Đang diễn ra
                              </span>
                            )}
                          </div>
                          <div>
                            {assignment.is_published ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
                                <Send className="w-3.5 h-3.5" /> Đã phát hành
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-full">
                                <EyeOff className="w-3.5 h-3.5" /> Bản nháp
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTogglePublish(assignment.id, assignment.is_published)}
                              className={`p-2 rounded-lg transition-colors border border-transparent ${
                                assignment.is_published 
                                  ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100'
                                  : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100'
                              }`}
                              title={assignment.is_published ? "Hủy phát hành" : "Phát hành cho học sinh"}
                            >
                              {assignment.is_published ? <EyeOff className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                            </button>
                            <Link 
                              to={`/teacher/classes/${id}/assignments/${assignment.id}/edit`}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                              title="Chỉnh sửa bài tập"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button 
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                              title="Xóa bài tập"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 bg-gray-50/50">
              Lớp học chưa có bài tập nào được giao.
            </div>
          )}
        </div>
      )}

      {/* Drill-down Modal for topic weaknesses */}
      {showTopicModal && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-slideUp">
            <div className="p-6 border-b flex justify-between items-center bg-slate-100/30">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Chi tiết học sinh - Chủ đề: {selectedTopic.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Danh sách học sinh học tập chủ đề này, xếp theo tỷ lệ chính xác từ thấp đến cao.</p>
              </div>
              <button
                onClick={() => setShowTopicModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition border border-transparent hover:border-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="flex flex-col justify-center items-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
                  <p className="text-sm text-gray-500">Đang lấy dữ liệu chi tiết...</p>
                </div>
              ) : topicStudents.length > 0 ? (
                <div className="overflow-hidden border border-gray-100 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-gray-150 text-sm">
                    <thead className="bg-gray-50">
                      <tr className="font-semibold text-gray-500">
                        <th className="px-6 py-3 text-left">Học sinh</th>
                        <th className="px-6 py-3 text-left">Điểm đạt được</th>
                        <th className="px-6 py-3 text-center">Tỷ lệ chính xác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-gray-700 font-medium">
                      {topicStudents.map((student: any) => (
                        <tr key={student.student_id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-900 flex items-center justify-center font-bold mr-3 border border-slate-300">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">
                            {student.score} pts
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${student.accuracy_pct >= 75 ? 'bg-green-50 text-green-700 border-green-200' :
                                student.accuracy_pct >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                              }`}>
                              {student.accuracy_pct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  Chưa có học sinh nào làm bài tập trong chủ đề này.
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowTopicModal(false)}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-semibold transition duration-150 shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

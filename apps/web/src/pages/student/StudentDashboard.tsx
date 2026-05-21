import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Calendar, Clock, Trophy, Loader2, ArrowRight, Flame, Target, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

interface Analytics {
  questions_due_today: number;
  total_questions_answered: number;
  overall_accuracy: number;
  current_streak_days: number;
  weekly_activity: { date: string; sessions: number }[];
}

interface Assignment {
  id: string;
  title: string;
  deadline: string;
  status: string;
}

export default function StudentDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [dailySchedule, setDailySchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, assignmentsRes, weakTopicsRes, calendarRes, scheduleRes] = await Promise.all([
          api.get('/api/analytics/student/me'),
          api.get('/api/assignments/my?status=pending'),
          api.get('/api/analytics/student/me/weak-topics'),
          api.get('/api/analytics/student/me/calendar'),
          api.get('/api/sm2/daily-schedule')
        ]);

        setAnalytics(analyticsRes.data.data || analyticsRes.data);
        setAssignments(assignmentsRes.data.data || assignmentsRes.data);

        const weakData = weakTopicsRes.data.data || weakTopicsRes.data;
        setWeakTopics(weakData.weak_topics || []);

        const calData = calendarRes.data.data || calendarRes.data;
        setCalendarData(calData.calendar || []);

        setDailySchedule(scheduleRes.data.data || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-gray-500 animate-pulse">Đang tải lộ trình học...</p>
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  const dueToday = analytics?.questions_due_today || 0;

  // Create 7-day dot calendar
  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const activityMap = new Map(analytics?.weekly_activity?.map(a => [a.date, a.sessions]) || []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-16 animate-in fade-in duration-500">
      
      {/* 1. Hero / Greeting */}
      <section className="pt-8 sm:pt-12">
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-6">
          Hôm nay học gì?
        </h1>
        <div className="text-xl sm:text-2xl text-gray-500 font-medium">
          {dueToday > 0 ? (
            <p>Bạn có <span className="text-blue-600 font-bold">{dueToday} câu hỏi</span> cần ôn tập. Hãy hoàn thành để duy trì chuỗi học tập!</p>
          ) : (
            <p>Tuyệt vời! Bạn đã hoàn thành mục tiêu ôn tập hôm nay.</p>
          )}
        </div>
      </section>

      {/* 2. SM-2 Schedule & Assignments Feed */}
      <section className="space-y-6">
        <div className="flex justify-between items-baseline border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Đường dẫn học tập</h2>
          <Link to="/student/classes" className="text-blue-600 text-sm font-bold hover:underline flex items-center">
            Tất cả lớp <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="space-y-2">
          {/* Daily Schedule (SM-2) */}
          {dailySchedule.map((cls, idx) => (
            <div key={`sm2-${idx}`} className="group p-4 -mx-4 rounded-2xl hover:bg-white hover:shadow-sm transition-all cursor-default border border-transparent hover:border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-gray-900">{cls.class_name} <span className="text-gray-400 font-medium text-base ml-2">Ôn tập</span></h3>
                <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-bold">{cls.total_due} câu</span>
              </div>
              <div className="space-y-1 pl-4 border-l-2 border-gray-200 mt-2">
                {cls.assignments.map((ass: any) => (
                  <div key={ass.assignment_id} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform py-2">
                    <span className="text-gray-700 text-lg">{ass.title}</span>
                    <Link
                      to={ass.assignment_id !== 'general' ? `/quiz?assignment=${ass.assignment_id}` : '#'}
                      className="text-sm font-bold text-blue-600 hover:text-blue-800 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center"
                    >
                      Bắt đầu <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Assignments */}
          {assignments.map(assignment => {
            const isOverdue = assignment.deadline ? new Date(assignment.deadline) < new Date() : false;
            const sessions = (assignment as any).quiz_sessions || [];
            const completedSessions = sessions.filter((s: any) => s.status === 'completed');
            const attemptsCount = completedSessions.length;
            const maxAttempts = (assignment as any).max_attempts || 0;
            const isLocked = maxAttempts > 0 && attemptsCount >= maxAttempts;

            return (
              <div key={`ass-${assignment.id}`} className={`group p-4 -mx-4 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all hover:translate-x-1 ${isLocked ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      {assignment.title}
                      {isOverdue && <span className="ml-3 px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full font-bold">Quá hạn</span>}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                      {assignment.deadline ? `Hạn: ${new Date(assignment.deadline).toLocaleDateString()}` : 'Không có hạn'}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isLocked ? (
                      <Link to={`/session-result?id=${completedSessions[0].id}`} className="text-sm font-bold text-gray-400 hover:text-gray-600">
                        Đã nộp
                      </Link>
                    ) : (
                      <Link
                        to={`/quiz?assignment=${assignment.id}`}
                        className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {attemptsCount > 0 ? 'Làm lại' : 'Làm bài'} <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {dailySchedule.length === 0 && assignments.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Không có nhiệm vụ nào trong hàng chờ.</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Progress & Statistics */}
      <section className="border-t border-gray-100 pt-12 pb-24 space-y-12">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tiến độ của bạn</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="text-gray-500 text-sm font-medium">Chuỗi học tập</p>
            <p className="text-4xl font-black text-gray-900 flex items-center">
              {analytics?.current_streak_days || 0} <Flame className="w-6 h-6 text-orange-500 ml-2" />
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-500 text-sm font-medium">Độ chính xác</p>
            <p className="text-4xl font-black text-gray-900">
              {Math.round(analytics?.overall_accuracy || 0)}<span className="text-2xl text-gray-400 ml-1">%</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-500 text-sm font-medium">Đã trả lời</p>
            <p className="text-4xl font-black text-gray-900">{analytics?.total_questions_answered || 0}</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-500 text-sm font-medium">Số phiên học</p>
            <p className="text-4xl font-black text-gray-900">{analytics?.total_questions_answered ? Math.ceil(analytics.total_questions_answered / 10) : 0}</p>
          </div>
        </div>

        {/* Activity dots */}
        <div className="space-y-4 pt-4">
          <p className="text-gray-500 text-sm font-medium">Hoạt động 7 ngày qua</p>
          <div className="flex gap-3">
            {last7Days.map((date, idx) => {
              const isActive = (activityMap.get(date) || 0) > 0;
              return (
                <div
                  key={date}
                  title={date}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md transform -translate-y-1' : 'bg-gray-100 text-gray-400'}`}
                >
                  {new Date(date).getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}

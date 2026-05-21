import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Calendar, Clock, Trophy, Loader2, ArrowRight, Flame, CheckCircle, AlertCircle, Home, TrendingUp, Target } from 'lucide-react';
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
  due_date: string;
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
  const [activeTab, setActiveTab] = useState<'home' | 'overview' | 'weakness' | 'calendar'>('home');

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
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-gray-500 animate-pulse">Đang chuẩn bị bài học...</p>
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-purple-50/50 p-1.5 rounded-2xl w-fit mb-8 border border-purple-100">
        {[
          { id: 'home', label: 'Trang chủ', icon: Home },
          { id: 'overview', label: 'Tổng quan tiến độ', icon: TrendingUp },
          { id: 'weakness', label: 'Phân tích điểm yếu', icon: Target },
          { id: 'calendar', label: 'Lịch học tập', icon: Calendar },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === tab.id
                ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
                : 'text-gray-500 hover:text-purple-600 hover:bg-purple-100/50'
              }`}
          >
            <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-purple-600' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'home' && (
        <div className="space-y-8 animate-in fade-in duration-300">

          {/* Top Info Bar: Streak & Dot Calendar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center text-orange-500 font-extrabold text-lg mb-4 sm:mb-0">
              <Flame className="w-6 h-6 mr-1" />
              {analytics?.current_streak_days || 0} ngày chuỗi (Streak)
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-500 mr-2 uppercase tracking-wider">7 ngày qua:</span>
              {last7Days.map((date, idx) => {
                const isActive = (activityMap.get(date) || 0) > 0;
                return (
                  <div
                    key={date}
                    title={date}
                    className={`w-3 h-3 rounded-full ${isActive ? 'bg-purple-600' : 'bg-gray-200'}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Hero Card */}
          <div className={`rounded-3xl shadow-xl shadow-purple-900/5 overflow-hidden transition-colors ${dueToday > 0 ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
            }`}>
            <div className="p-8 sm:p-12 text-white flex justify-between items-center">
              <div>
                {dueToday > 0 ? (
                  <>
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
                      {dueToday} câu hỏi cần ôn hôm nay
                    </h2>
                    <p className="text-purple-100 mb-8 text-lg font-medium">Hoàn thành bài tập để duy trì chuỗi học tập của bạn!</p>
                    {/* Bắt đầu học bằng Assignment đầu tiên nếu có, nếu không thì báo lỗi */}
                    {assignments.length > 0 ? (
                      <Link
                        to={`/quiz?assignment=${assignments[0].id}`}
                        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-2xl text-purple-700 bg-white hover:bg-purple-50 hover:scale-105 transition-all shadow-md"
                      >
                        <Brain className="w-6 h-6 mr-2" /> BẮT ĐẦU HỌC
                      </Link>
                    ) : (
                      <div className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-2xl text-purple-700 bg-white opacity-50 shadow-md">
                        <Brain className="w-6 h-6 mr-2" /> CHƯA CÓ BÀI TẬP
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-3 flex items-center">
                      Hôm nay đã ôn xong!
                    </h2>
                    <p className="text-emerald-100 mb-8 text-lg">Bạn đã hoàn thành mục tiêu ngày hôm nay. Nghỉ ngơi thôi!</p>
                  </>
                )}
              </div>
              <div className="hidden md:block">
                {dueToday > 0 ? (
                  <Brain className="w-40 h-40 text-white opacity-20" />
                ) : (
                  <CheckCircle className="w-40 h-40 text-white opacity-20" />
                )}
              </div>
            </div>
          </div>

          {/* M05: Lịch Ôn Tập SM-2 */}
          {dailySchedule.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-end mb-4 px-2">
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center">
                  <Target className="w-6 h-6 mr-2 text-purple-600" />
                  Lịch ôn tập hôm nay (SM-2)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailySchedule.map((cls, idx) => (
                  <div key={idx} className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-400 to-indigo-500"></div>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-extrabold text-gray-900 text-lg group-hover:text-purple-700 transition-colors">{cls.class_name}</h4>
                      <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-lg">
                        {cls.total_due} câu
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {cls.assignments.map((ass: any) => (
                        <div key={ass.assignment_id} className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-purple-200 transition-colors">
                          <span className="text-sm font-medium text-gray-700 truncate mr-2" title={ass.title}>
                            {ass.title}
                          </span>
                          <Link
                            to={ass.assignment_id !== 'general' ? `/quiz?assignment=${ass.assignment_id}` : '#'}
                            className="shrink-0 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                          >
                            Ôn {ass.questions.length} câu
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bài được giao (Horizontal Scroll) */}
          <div>
            <div className="flex justify-between items-end mb-4 px-2">
              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Bài được giao</h3>
              <Link to="/student/classes" className="text-purple-600 text-sm font-bold hover:underline flex items-center">
                Xem tất cả lớp <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {assignments.length > 0 ? (
              <div className="flex overflow-x-auto pb-6 -mx-4 px-4 space-x-4 snap-x">
                {assignments.map(assignment => {
                  const isOverdue = assignment.deadline ? new Date(assignment.deadline) < new Date() : false;
                  const sessions = (assignment as any).quiz_sessions || [];
                  const completedSessions = sessions.filter((s: any) => s.status === 'completed');
                  const attemptsCount = completedSessions.length;
                  const maxAttempts = (assignment as any).max_attempts || 0;
                  const isLocked = maxAttempts > 0 && attemptsCount >= maxAttempts;

                  return (
                    <div
                      key={assignment.id}
                      className={`snap-start flex-none w-80 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col group transition-all ${isLocked ? 'opacity-80' : 'hover:border-purple-300 hover:shadow-xl hover:-translate-y-1'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-extrabold text-gray-900 group-hover:text-purple-700 line-clamp-2">{assignment.title}</h4>
                        {isOverdue && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />}
                      </div>

                      <div className="flex items-center text-sm font-medium mt-auto pt-4 border-t border-gray-100 mb-4">
                        <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span className={isOverdue ? 'text-red-600' : 'text-gray-600'}>
                          {isOverdue ? 'Quá hạn!' : assignment.deadline ? `Còn ${Math.ceil((new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} ngày` : 'Không hạn'}
                        </span>
                      </div>

                      <div className="mt-5 flex gap-2">
                        {isLocked ? (
                          <div className="w-full flex gap-2">
                            <Link to={`/session-result?id=${completedSessions[0].id}`} className="flex-1 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl text-center text-sm hover:bg-green-100 transition-colors">
                              Xem kết quả
                            </Link>
                            <button disabled className="flex-1 py-2.5 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed text-sm">
                              Hết lượt ({attemptsCount}/{maxAttempts})
                            </button>
                          </div>
                        ) : (
                          <div className="w-full flex gap-2">
                            {attemptsCount > 0 && (
                              <Link to={`/session-result?id=${completedSessions[0].id}`} className="flex-1 py-2.5 bg-purple-50 text-purple-700 font-bold rounded-xl text-center text-sm hover:bg-purple-100 transition-colors">
                                Kết quả
                              </Link>
                            )}
                            <Link
                              to={`/quiz?assignment=${assignment.id}`}
                              className="flex-1 text-center py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 font-bold rounded-xl transition-all shadow-sm text-sm"
                            >
                              {attemptsCount > 0 ? 'Làm lại' : 'Bắt đầu làm'}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p>Bạn không có bài tập nào đang chờ.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <h3 className="text-xl font-extrabold text-gray-900 w-full mb-8 text-center">Độ chính xác tổng</h3>
            <div className="relative w-56 h-56 rounded-full flex items-center justify-center bg-purple-50/50">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3e8ff" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#9333ea" strokeWidth="12"
                  strokeDasharray={`${(analytics?.overall_accuracy || 0) * 2.51} 251`}
                  strokeLinecap="round" />
              </svg>
              <div className="text-center z-10">
                <span className="text-5xl font-black text-purple-700 drop-shadow-sm">{Math.round(analytics?.overall_accuracy || 0)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">Thống kê chi tiết</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Tổng phiên học</span>
                <span className="font-extrabold text-gray-900 text-lg">{analytics?.total_questions_answered ? Math.ceil(analytics.total_questions_answered / 10) : 0}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Tổng số câu</span>
                <span className="font-extrabold text-gray-900 text-lg">{analytics?.total_questions_answered || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Chuỗi hiện tại (Streak)</span>
                <span className="font-extrabold text-orange-500 flex items-center text-lg"><Flame className="w-5 h-5 mr-1" /> {analytics?.current_streak_days || 0}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Hoạt động 7 ngày qua</h4>
              <div className="flex items-end justify-between h-24 gap-3">
                {last7Days.map(date => {
                  const count = activityMap.get(date) || 0;
                  // Max height 100%, let's say 10 sessions is max for bar
                  const heightPct = Math.min(100, Math.max(10, count * 20));
                  return (
                    <div key={date} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                      <div
                        className={`w-full rounded-md transition-all duration-300 ${count > 0 ? 'bg-gradient-to-t from-purple-600 to-indigo-500 group-hover:opacity-80 shadow-sm' : 'bg-gray-100'}`}
                        style={{ height: `${count > 0 ? heightPct : 10}%` }}
                      ></div>
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                        {count} phiên
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'weakness' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <h3 className="text-xl font-extrabold text-gray-900 flex items-center">
              <Target className="w-6 h-6 mr-3 text-red-500" /> Điểm yếu cần khắc phục
            </h3>
          </div>

          {weakTopics.length > 0 ? (
            <div className="space-y-4">
              {weakTopics.sort((a, b) => a.accuracy_pct - b.accuracy_pct).map((topic, i) => {
                const acc = Math.round(topic.accuracy_pct);
                const badge = acc < 60 ? 'bg-red-100 text-red-700 border-red-200' : acc <= 80 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200';
                const barColor = acc < 60 ? 'bg-red-500' : acc <= 80 ? 'bg-orange-500' : 'bg-green-500';

                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-5 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all shadow-sm bg-white">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-extrabold text-gray-900 text-lg">{topic.topic}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border shadow-sm ${badge}`}>
                          {acc}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${acc}%` }}></div>
                      </div>
                    </div>
                    <button className="sm:w-auto w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap shadow-sm">
                      Ôn ngay
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed flex flex-col items-center">
              <Trophy className="w-12 h-12 text-yellow-400 mb-3" />
              <p className="font-bold text-lg text-slate-700">Tuyệt vời!</p>
              <p>Bạn không có chủ đề nào bị yếu dưới 60%.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in duration-300">
          <h3 className="text-xl font-extrabold text-gray-900 mb-8 pb-4 border-b border-gray-100 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-purple-600" /> Lịch sử học tập (Tháng này)
          </h3>

          <div className="grid grid-cols-7 gap-3">
            {/* Day headers */}
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-2 uppercase tracking-wider">{d}</div>
            ))}

            {/* Calendar Grid */}
            {(() => {
              const today = new Date();
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              const firstDay = new Date(currentYear, currentMonth, 1).getDay();
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

              const blanks = Array.from({ length: firstDay }).map((_, i) => (
                <div key={`blank-${i}`} className="aspect-square"></div>
              ));

              const days = Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const activity = calendarData.find((c: any) => c.date === dateStr);
                const hasActivity = !!activity;

                const intensity = hasActivity && activity.accuracy >= 80
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-sm text-white hover:scale-105'
                  : hasActivity
                    ? 'bg-purple-300 text-purple-900 hover:scale-105'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100';

                return (
                  <div
                    key={`day-${day}`}
                    className="aspect-square flex items-center justify-center p-0.5 relative group"
                  >
                    <div className={`w-full h-full rounded-xl flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${intensity}`}>
                      {day}
                    </div>

                    {/* Tooltip */}
                    {hasActivity && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p className="font-bold mb-1">Ngày {day}/{currentMonth + 1}</p>
                        <p>{activity.sessions_count} phiên • {activity.questions_count} câu</p>
                        <p className="text-green-400">{Math.round(activity.accuracy)}% chính xác</p>
                      </div>
                    )}
                  </div>
                );
              });
              return [...blanks, ...days];
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

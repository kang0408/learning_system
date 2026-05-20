import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Calendar, Clock, Trophy, Loader2, ArrowRight, Flame, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'progress'>('progress');
  const [progressSubTab, setProgressSubTab] = useState<'overview' | 'weakness' | 'calendar'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, assignmentsRes, weakTopicsRes, calendarRes] = await Promise.all([
          api.get('/api/analytics/student/me'),
          api.get('/api/assignments/my?status=pending'),
          api.get('/api/analytics/student/me/weak-topics'),
          api.get('/api/analytics/student/me/calendar')
        ]);
        
        setAnalytics(analyticsRes.data.data || analyticsRes.data);
        setAssignments(assignmentsRes.data.data || assignmentsRes.data);
        
        const weakData = weakTopicsRes.data.data || weakTopicsRes.data;
        setWeakTopics(weakData.weak_topics || []);

        const calData = calendarRes.data.data || calendarRes.data;
        setCalendarData(calData.calendar || []);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('home')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'home' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Trang chủ
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'progress' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tiến độ
        </button>
      </div>

      {activeTab === 'home' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Top Info Bar: Streak & Dot Calendar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center text-orange-500 font-bold text-lg mb-4 sm:mb-0">
              <Flame className="w-6 h-6 mr-1" />
              {analytics?.current_streak_days || 0} ngày chuỗi (Streak)
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 mr-2">Hoạt động tuần này:</span>
              {last7Days.map((date, idx) => {
                const isActive = (activityMap.get(date) || 0) > 0;
                return (
                  <div 
                    key={date}
                    title={date}
                    className={`w-3 h-3 rounded-full ${isActive ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Hero Card */}
          <div className={`rounded-2xl shadow-lg overflow-hidden transition-colors ${
            dueToday > 0 ? 'bg-gradient-to-r from-indigo-600 to-blue-700' : 'bg-gradient-to-r from-emerald-500 to-teal-600'
          }`}>
            <div className="p-8 sm:p-12 text-white flex justify-between items-center">
              <div>
                {dueToday > 0 ? (
                  <>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                      {dueToday} câu hỏi cần ôn hôm nay
                    </h2>
                    <p className="text-indigo-100 mb-8 text-lg">Hoàn thành bài tập để duy trì chuỗi học tập của bạn!</p>
                    {/* Bắt đầu học bằng Assignment đầu tiên nếu có, nếu không thì báo lỗi */}
                    {assignments.length > 0 ? (
                      <Link 
                        to={`/quiz?assignment=${assignments[0].id}`} 
                        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 hover:scale-105 transition-all shadow-md"
                      >
                        <Brain className="w-6 h-6 mr-2" /> BẮT ĐẦU HỌC
                      </Link>
                    ) : (
                      <div className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-indigo-700 bg-white opacity-50 shadow-md">
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

          {/* Bài được giao (Horizontal Scroll) */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xl font-bold text-gray-900">Bài được giao</h3>
              <Link to="/student/classes" className="text-indigo-600 text-sm font-medium hover:underline flex items-center">
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
                      className={`snap-start flex-none w-72 bg-white rounded-xl shadow-sm border p-5 flex flex-col group transition-all ${isLocked ? 'opacity-80' : 'hover:border-indigo-400 hover:shadow-md'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-700 line-clamp-2">{assignment.title}</h4>
                        {isOverdue && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />}
                      </div>
                      
                      <div className="flex items-center text-sm font-medium mt-auto pt-4 border-t border-gray-100 mb-4">
                        <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span className={isOverdue ? 'text-red-600' : 'text-gray-600'}>
                          {isOverdue ? 'Quá hạn!' : assignment.deadline ? `Còn ${Math.ceil((new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} ngày` : 'Không hạn'}
                        </span>
                      </div>

                        <div className="mt-4 flex gap-2">
                          {isLocked ? (
                            <div className="w-full flex gap-2">
                              <Link to={`/session-result?id=${completedSessions[0].id}`} className="flex-1 py-2 bg-green-50 text-green-700 font-bold rounded-lg text-center text-sm hover:bg-green-100">
                                Xem kết quả
                              </Link>
                              <button disabled className="flex-1 py-2 bg-gray-100 text-gray-500 font-bold rounded-lg cursor-not-allowed text-sm">
                                Hết lượt ({attemptsCount}/{maxAttempts})
                              </button>
                            </div>
                          ) : (
                            <div className="w-full flex gap-2">
                              {attemptsCount > 0 && (
                                <Link to={`/session-result?id=${completedSessions[0].id}`} className="flex-1 py-2 bg-green-50 text-green-700 font-bold rounded-lg text-center text-sm hover:bg-green-100">
                                  Xem kết quả
                                </Link>
                              )}
                              <Link 
                                to={`/quiz?assignment=${assignment.id}`}
                                className="flex-1 text-center py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg transition-colors text-sm"
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

      {activeTab === 'progress' && (
        <div className="animate-in fade-in duration-300">
          {/* Sub Tabs for Progress */}
          <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg w-fit mb-6">
            <button
              onClick={() => setProgressSubTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                progressSubTab === 'overview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setProgressSubTab('weakness')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                progressSubTab === 'weakness' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Điểm yếu
            </button>
            <button
              onClick={() => setProgressSubTab('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                progressSubTab === 'calendar' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lịch học
            </button>
          </div>

          {progressSubTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
              <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center justify-center">
                <h3 className="text-lg font-bold text-slate-800 w-full mb-6">Độ chính xác tổng</h3>
                <div className="relative w-48 h-48 rounded-full flex items-center justify-center bg-slate-50">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#4f46e5" strokeWidth="12" 
                      strokeDasharray={`${(analytics?.overall_accuracy || 0) * 2.51} 251`} 
                      strokeLinecap="round" />
                  </svg>
                  <div className="text-center z-10">
                    <span className="text-4xl font-bold text-indigo-700">{Math.round(analytics?.overall_accuracy || 0)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Thống kê chi tiết</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-slate-600">Tổng phiên học</span>
                    <span className="font-bold text-slate-900">{analytics?.total_questions_answered ? Math.ceil(analytics.total_questions_answered / 10) : 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-slate-600">Tổng số câu</span>
                    <span className="font-bold text-slate-900">{analytics?.total_questions_answered || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-slate-600">Chuỗi hiện tại (Streak)</span>
                    <span className="font-bold text-orange-500 flex items-center"><Flame className="w-4 h-4 mr-1"/> {analytics?.current_streak_days || 0}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-600 mb-3">Hoạt động 7 ngày qua</h4>
                  <div className="flex items-end justify-between h-20 gap-2">
                    {last7Days.map(date => {
                      const count = activityMap.get(date) || 0;
                      // Max height 100%, let's say 10 sessions is max for bar
                      const heightPct = Math.min(100, Math.max(10, count * 20)); 
                      return (
                        <div key={date} className="flex-1 flex flex-col justify-end items-center group relative">
                          <div 
                            className={`w-full rounded-t-sm transition-all ${count > 0 ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-slate-200'}`} 
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

          {progressSubTab === 'weakness' && (
            <div className="bg-white rounded-xl shadow-sm border p-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-orange-500" /> Điểm yếu cần khắc phục
                </h3>
              </div>
              
              {weakTopics.length > 0 ? (
                <div className="space-y-6">
                  {weakTopics.sort((a, b) => a.accuracy_pct - b.accuracy_pct).map((topic, i) => {
                    const acc = Math.round(topic.accuracy_pct);
                    const badge = acc < 60 ? 'bg-red-100 text-red-700 border-red-200' : acc <= 80 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200';
                    const barColor = acc < 60 ? 'bg-red-500' : acc <= 80 ? 'bg-yellow-500' : 'bg-green-500';

                    return (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-slate-800 text-lg">{topic.topic}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${badge}`}>
                              {acc}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${acc}%` }}></div>
                          </div>
                        </div>
                        <button className="sm:w-auto w-full px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap">
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

          {progressSubTab === 'calendar' && (
            <div className="bg-white rounded-xl shadow-sm border p-6 animate-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" /> Lịch sử học tập (Tháng này)
              </h3>
              
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">{d}</div>
                ))}
                
                {/* Calendar Grid (Mock 30 days) */}
                {Array.from({ length: 30 }).map((_, i) => {
                  const day = i + 1;
                  // Mock some activity
                  const hasActivity = day % 3 === 0 || day % 5 === 0;
                  const intensity = day % 3 === 0 ? 'bg-indigo-500' : 'bg-indigo-300';
                  
                  return (
                    <div 
                      key={i} 
                      className="aspect-square flex items-center justify-center p-1 relative group"
                    >
                      <div className={`w-full h-full rounded-md flex items-center justify-center font-medium text-sm transition-colors cursor-pointer ${
                        hasActivity ? `${intensity} text-white hover:brightness-110` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}>
                        {day}
                      </div>
                      
                      {/* Tooltip */}
                      {hasActivity && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <p className="font-bold mb-1">Ngày {day}</p>
                          <p>2 phiên • 30 câu</p>
                          <p className="text-green-400">85% chính xác</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

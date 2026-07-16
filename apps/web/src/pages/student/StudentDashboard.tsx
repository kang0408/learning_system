import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import api from '../../api/axios';

interface Analytics {
  questions_due_today: number;
  total_questions_answered: number;
  overall_accuracy: number;
  current_streak_days: number;
  weekly_activity: { date: string; sessions: number }[];
  sm2_summary?: {
    total_questions: number;
    new: { count: number; pct: number };
    learning: { count: number; pct: number; at_risk: number; in_progress: number };
    mastered: { count: number; pct: number };
    due_today: number;
  };
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
  const [, setCalendarData] = useState<any[]>([]);
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
      <div className="h-64 flex flex-col justify-center items-start">
        <div className="text-4xl font-black tracking-tighter uppercase animate-pulse text-indigo-600">Loading...</div>
      </div>
    );
  }

  if (error) return <div className="text-red-600 font-bold border-2 border-red-600 p-4">{error}</div>;

  const dueToday = analytics?.sm2_summary?.due_today ?? analytics?.questions_due_today ?? 0;

  return (
    <div className="space-y-24 animate-in fade-in duration-700">
      
      {/* Hero / Greeting - Editorial Style */}
      <section className="border-b-4 border-zinc-900 pb-12">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
          Today's <br /> <span className="text-indigo-600">Agenda.</span>
        </h1>
        <div className="text-2xl md:text-4xl font-medium tracking-tight max-w-3xl">
          {dueToday > 0 ? (
            <p>You have <span className="font-black bg-indigo-600 text-white px-2 py-1">{dueToday} reviews</span> pending today. Consistency builds mastery.</p>
          ) : (
            <p>All clear. <span className="text-zinc-500">You've completed your daily goals.</span></p>
          )}
        </div>
      </section>

      {/* Grid Layout breaking symmetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Tasks */}
        <section className="lg:col-span-7 space-y-12">
          <div className="flex justify-between items-end border-b-2 border-zinc-900 pb-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase">Action Items</h2>
            <Link to="/student/classes" className="font-bold text-sm uppercase tracking-widest text-indigo-600 hover:underline flex items-center">
              All Classes <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="space-y-6">
            {/* Daily Schedule (SM-2) */}
            {dailySchedule.map((cls, idx) => (
              <div key={`sm2-${idx}`} className="border-2 border-zinc-900 p-6 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-colors group">
                <div className="flex justify-between items-start mb-6">
                  <h4 className="text-2xl font-black tracking-tighter uppercase">{cls.class_name}</h4>
                  <span className="font-bold text-lg border-2 border-current px-3 py-1">{cls.total_due} DUE</span>
                </div>
                <div className="space-y-4">
                  {cls.assignments.map((ass: any) => (
                    <Link
                      key={ass.assignment_id}
                      to={ass.assignment_id !== 'general' ? `/quiz?assignment=${ass.assignment_id}` : '#'}
                      className="flex justify-between items-center group/item border-t border-current pt-4 font-medium text-lg hover:italic"
                    >
                      <span>{ass.title}</span>
                      <ArrowUpRight className="w-6 h-6 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Assignments */}
            {(() => {
              const pendingAssignments = assignments.filter(a => {
                for (const cls of dailySchedule) {
                  if (cls.assignments.some((ass: any) => ass.assignment_id === a.id)) return false;
                }
                return true;
              });

              if (pendingAssignments.length === 0 && dailySchedule.length === 0) {
                return (
                  <div className="p-12 border-2 border-dashed border-zinc-300 text-center font-bold text-zinc-400 uppercase tracking-widest text-xl">
                    No pending tasks
                  </div>
                );
              }

              return pendingAssignments.map(assignment => {
                const isOverdue = assignment.deadline ? new Date(assignment.deadline) < new Date() : false;
                const sessions = (assignment as any).quiz_sessions || [];
                const completedSessions = sessions.filter((s: any) => s.status === 'completed');
                const attemptsCount = completedSessions.length;
                const maxAttempts = (assignment as any).max_attempts || 0;
                const isLocked = maxAttempts > 0 && attemptsCount >= maxAttempts;

                return (
                  <div key={`ass-${assignment.id}`} className={`border-2 border-zinc-900 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all ${isLocked ? 'opacity-50 bg-zinc-100' : 'hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] hover:border-indigo-600 bg-white'}`}>
                    <div>
                      <h4 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                        {assignment.title}
                        {isOverdue && <span className="bg-red-600 text-white text-xs px-2 py-1 tracking-widest">OVERDUE</span>}
                      </h4>
                      <p className="font-medium text-zinc-500 mt-2">
                        {assignment.deadline ? `DEADLINE: ${new Date(assignment.deadline).toLocaleDateString()}` : 'NO DEADLINE'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      {isLocked ? (
                        <span className="font-bold border-2 border-zinc-900 px-4 py-2 w-full md:w-auto text-center">SUBMITTED</span>
                      ) : (
                        <Link
                          to={`/quiz?assignment=${assignment.id}`}
                          className="font-bold bg-zinc-900 text-white border-2 border-zinc-900 px-6 py-2 w-full md:w-auto text-center hover:bg-indigo-600 hover:border-indigo-600 transition-colors uppercase tracking-widest"
                        >
                          {attemptsCount > 0 ? 'Retry' : 'Start'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </section>

        {/* Right Column: Stats & Weaknesses */}
        <section className="lg:col-span-5 space-y-12">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-zinc-900 p-6 flex flex-col justify-between aspect-square bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(24,24,27,1)] transition-transform">
              <p className="font-bold uppercase tracking-widest text-sm text-zinc-500">Streak</p>
              <p className="text-6xl font-black tracking-tighter text-indigo-600">{analytics?.current_streak_days || 0}</p>
            </div>
            <div className="border-2 border-indigo-600 p-6 flex flex-col justify-between aspect-square bg-indigo-600 text-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(24,24,27,1)] transition-transform">
              <p className="font-bold uppercase tracking-widest text-sm text-indigo-200">Accuracy</p>
              <p className="text-6xl font-black tracking-tighter">{Math.round(analytics?.overall_accuracy || 0)}%</p>
            </div>
            <div className="border-2 border-zinc-900 p-6 flex flex-col justify-between aspect-[2/1] col-span-2 bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] transition-transform">
              <p className="font-bold uppercase tracking-widest text-sm text-zinc-500">Total Answered</p>
              <p className="text-8xl md:text-9xl font-black tracking-tighter leading-none">{analytics?.total_questions_answered || 0}</p>
            </div>
            
            {/* Memory Engine Stats */}
            {analytics?.sm2_summary && (
              <div className="border-2 border-zinc-900 p-6 flex flex-col gap-4 bg-white col-span-2 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] transition-transform">
                <h3 className="font-black uppercase tracking-tighter text-2xl border-b-2 border-zinc-900 pb-2">Memory Engine</h3>
                
                <div className="grid grid-cols-3 gap-2 text-center mt-2">
                  <div className="border-r-2 border-zinc-900 pr-2 flex flex-col items-center">
                    <span className="font-bold uppercase tracking-widest text-xs text-zinc-500">New</span>
                    <span className="text-3xl font-black tracking-tighter">{analytics.sm2_summary.new.count}</span>
                  </div>
                  <div className="border-r-2 border-zinc-900 px-2 flex flex-col items-center">
                    <span className="font-bold uppercase tracking-widest text-xs text-zinc-500">Learning</span>
                    <span className="text-3xl font-black tracking-tighter">{analytics.sm2_summary.learning.count}</span>
                  </div>
                  <div className="pl-2 flex flex-col items-center">
                    <span className="font-bold uppercase tracking-widest text-xs text-zinc-500">Mastered</span>
                    <span className="text-3xl font-black tracking-tighter text-indigo-600">{analytics.sm2_summary.mastered.count}</span>
                  </div>
                </div>

                <div className="flex gap-2 text-sm font-bold uppercase tracking-widest mt-4">
                  {analytics.sm2_summary.learning.at_risk > 0 && (
                    <span className="bg-red-600 text-white px-2 py-1 flex-1 text-center border-2 border-red-600">
                      {analytics.sm2_summary.learning.at_risk} AT RISK
                    </span>
                  )}
                  {analytics.sm2_summary.learning.in_progress > 0 && (
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 flex-1 text-center border-2 border-indigo-600">
                      {analytics.sm2_summary.learning.in_progress} IN PROGRESS
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {weakTopics && weakTopics.length > 0 && (
            <div>
              <h3 className="text-2xl font-black tracking-tighter uppercase mb-6 border-b-2 border-zinc-900 pb-2">Focus Areas</h3>
              <div className="space-y-4">
                {weakTopics.slice(0, 5).map((topic, i) => (
                  <div key={i} className="flex flex-col border-2 border-zinc-900 p-4 bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] transition-transform">
                    <div className="flex justify-between items-start border-b-2 border-zinc-200 pb-2 mb-2">
                      <span className="font-black text-xl tracking-tighter uppercase">{topic.topic}</span>
                      <span className={`font-bold px-2 py-1 text-xs tracking-widest uppercase text-white ${
                        topic.trend === 'improving' ? 'bg-indigo-600' : 
                        topic.trend === 'declining' ? 'bg-red-600' : 'bg-zinc-500'
                      }`}>
                        {topic.trend}
                      </span>
                    </div>
                    <div className="flex justify-between items-end text-sm font-bold uppercase tracking-widest">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                        <span className="text-red-600">{topic.weak_questions} HARD Qs</span>
                        <span className="text-amber-600">{topic.overdue_questions} OVERDUE</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-zinc-500 text-[10px]">MEMORY SCORE</span>
                        <span className="text-lg font-black">{topic.avg_ef}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}

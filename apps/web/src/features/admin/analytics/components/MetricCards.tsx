import React from 'react';
import { Users, Database, BookOpen, Flame, ShieldAlert, Award } from 'lucide-react';
import type { SystemMetrics } from '../types';

interface Props {
  metrics: SystemMetrics | null;
  loading: boolean;
}

export const MetricCards: React.FC<Props> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Realtime Exam & Active Users */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500/20" /> Real-time Live
          </span>
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
            <Flame className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.realtime.activeQuizSessionsNow}
          </div>
          <p className="text-xs font-bold text-slate-500 mt-1">Lượt thi đang làm trực tiếp</p>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Hoạt động (15p vừa qua):</span>
          <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
            {metrics.realtime.recentActiveUsers15m} user
          </span>
        </div>
      </div>

      {/* Users Count & Roles */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" /> Người Dùng
          </span>
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.users.total}
          </div>
          <p className="text-xs font-bold text-slate-500 mt-1">Tổng tài khoản trong hệ thống</p>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 gap-1 overflow-x-auto">
          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
            Học sinh: {metrics.users.byRole.student || 0}
          </span>
          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
            Giáo viên: {metrics.users.byRole.teacher || 0}
          </span>
          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
            Admin: {metrics.users.byRole.admin || 0}
          </span>
        </div>
      </div>

      {/* Content & System Assets */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-500" /> Nội Dung Dữ Liệu
          </span>
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.content.questions}
          </div>
          <p className="text-xs font-bold text-slate-500 mt-1">Tổng câu hỏi trong Ngân hàng</p>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Lớp học: <strong className="text-slate-900">{metrics.content.classes}</strong></span>
          <span>Lượt làm bài: <strong className="text-slate-900">{metrics.content.quizSessions}</strong></span>
        </div>
      </div>

      {/* Postgres Database Stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-purple-500" /> Cơ Sở Dữ Liệu
          </span>
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
            <Database className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.database.databaseSize}
          </div>
          <p className="text-xs font-bold text-slate-500 mt-1">Dung lượng PostgreSQL DB</p>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Kết nối DB hoạt động:</span>
          <span className="font-extrabold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> {metrics.database.activeConnections} active
          </span>
        </div>
      </div>
    </div>
  );
};

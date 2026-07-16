import React from 'react';
import { Flame, Activity, CheckCircle, Clock } from 'lucide-react';
import type { StudentStats } from '../types';

interface StudentStatsOverviewProps {
  stats: StudentStats;
}

export const StudentStatsOverview: React.FC<StudentStatsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Số lượt làm bài</p>
          <Activity className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats.total_sessions || 0}</p>
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Câu hỏi đã làm</p>
          <Clock className="w-4 h-4 text-indigo-400" />
        </div>
        <p className="text-3xl font-bold text-indigo-600">{stats.total_questions_answered || 0}</p>
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Độ chính xác</p>
          <CheckCircle className="w-4 h-4 text-green-500" />
        </div>
        <p className="text-3xl font-bold text-green-600">{stats.overall_accuracy?.toFixed(1) || 0}%</p>
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Chuỗi ngày</p>
          <Flame className="w-4 h-4 text-orange-500" />
        </div>
        <p className="text-3xl font-bold text-orange-600 flex items-center gap-1.5">
          {stats.current_streak_days || 0}
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalyticsData, CalendarEvent } from '../types';
import { HeatmapCalendar } from './HeatmapCalendar';

interface DashboardStatsProps {
  analytics: AnalyticsData;
  calendar?: CalendarEvent[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ analytics, calendar = [] }) => {
  const { t } = useTranslation();

  return (
    <div id="stats-section" className="grid grid-cols-2 gap-4 scroll-mt-24">
      <div className="border-2 border-zinc-900 p-6 flex flex-col justify-between aspect-square bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(24,24,27,1)] transition-transform">
        <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">{t('student.dashboard.streak')}</p>
        <div>
          <p className="text-6xl font-black tracking-tighter text-indigo-600 leading-none">{analytics?.current_streak_days || 0}</p>
          <span className="font-bold text-xs uppercase tracking-widest text-zinc-400 mt-1 block">{t('student.dashboard.days')}</span>
        </div>
      </div>
      <div className="border-2 border-indigo-600 p-6 flex flex-col justify-between aspect-square bg-indigo-600 text-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(24,24,27,1)] transition-transform">
        <p className="font-bold uppercase tracking-widest text-xs text-indigo-200">{t('student.dashboard.accuracy')}</p>
        <p className="text-6xl font-black tracking-tighter leading-none">{Math.round(analytics?.overall_accuracy || 0)}%</p>
      </div>

      {/* 30-Day Activity Heatmap Calendar */}
      <HeatmapCalendar calendar={calendar} currentStreakDays={analytics?.current_streak_days} />

      <div className="border-2 border-zinc-900 p-6 flex flex-col justify-between aspect-[2/1] col-span-2 bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] transition-transform">
        <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">{t('student.dashboard.totalAnswered')}</p>
        <p className="text-7xl md:text-8xl font-black tracking-tighter leading-none text-zinc-900">{analytics?.total_questions_answered || 0}</p>
      </div>
    </div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalyticsData } from '../types';

interface DashboardStatsProps {
  analytics: AnalyticsData;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ analytics }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border-2 border-zinc-900 p-6 flex flex-col justify-between aspect-square bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(24,24,27,1)] transition-transform">
        <p className="font-bold uppercase tracking-widest text-sm text-zinc-500">{t('student.dashboard.streak')}</p>
        <p className="text-6xl font-black tracking-tighter text-indigo-600">{analytics?.current_streak_days || 0}</p>
      </div>
      <div className="border-2 border-indigo-600 p-6 flex flex-col justify-between aspect-square bg-indigo-600 text-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(24,24,27,1)] transition-transform">
        <p className="font-bold uppercase tracking-widest text-sm text-indigo-200">{t('student.dashboard.accuracy')}</p>
        <p className="text-6xl font-black tracking-tighter">{Math.round(analytics?.overall_accuracy || 0)}%</p>
      </div>
      <div className="border-2 border-zinc-900 p-6 flex flex-col justify-between aspect-[2/1] col-span-2 bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] transition-transform">
        <p className="font-bold uppercase tracking-widest text-sm text-zinc-500">{t('student.dashboard.totalAnswered')}</p>
        <p className="text-8xl md:text-9xl font-black tracking-tighter leading-none">{analytics?.total_questions_answered || 0}</p>
      </div>
      
      {analytics?.sm2_summary && (
        <div className="border-2 border-zinc-900 p-6 flex flex-col gap-4 bg-white col-span-2 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] transition-transform">
          <h3 className="font-black uppercase tracking-tighter text-2xl border-b-2 border-zinc-900 pb-2">
            {t('student.dashboard.memoryEngine')}
          </h3>
          
          <div className="grid grid-cols-3 gap-2 text-center mt-2">
            <div className="border-r-2 border-zinc-900 pr-2 flex flex-col items-center">
              <span className="font-bold uppercase tracking-widest text-xs text-zinc-500">{t('student.dashboard.new')}</span>
              <span className="text-3xl font-black tracking-tighter">{analytics.sm2_summary.new.count}</span>
            </div>
            <div className="border-r-2 border-zinc-900 px-2 flex flex-col items-center">
              <span className="font-bold uppercase tracking-widest text-xs text-zinc-500">{t('student.dashboard.learning')}</span>
              <span className="text-3xl font-black tracking-tighter">{analytics.sm2_summary.learning.count}</span>
            </div>
            <div className="pl-2 flex flex-col items-center">
              <span className="font-bold uppercase tracking-widest text-xs text-zinc-500">{t('student.dashboard.mastered')}</span>
              <span className="text-3xl font-black tracking-tighter text-indigo-600">{analytics.sm2_summary.mastered.count}</span>
            </div>
          </div>

          <div className="flex gap-2 text-sm font-bold uppercase tracking-widest mt-4">
            {analytics.sm2_summary.learning.at_risk > 0 && (
              <span className="bg-red-600 text-white px-2 py-1 flex-1 text-center border-2 border-red-600">
                {analytics.sm2_summary.learning.at_risk} {t('student.dashboard.atRisk')}
              </span>
            )}
            {analytics.sm2_summary.learning.in_progress > 0 && (
              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 flex-1 text-center border-2 border-indigo-600">
                {analytics.sm2_summary.learning.in_progress} {t('student.dashboard.inProgress')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

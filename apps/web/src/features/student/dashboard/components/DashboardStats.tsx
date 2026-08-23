import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalyticsData } from '../types';

interface DashboardStatsProps {
  analytics: AnalyticsData;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ analytics }) => {
  const { t } = useTranslation();

  const sm2 = analytics?.sm2_summary;
  const newCount = sm2?.new?.count || 0;
  const learningCount = sm2?.learning?.count || 0;
  const masteredCount = sm2?.mastered?.count || 0;
  const atRiskCount = sm2?.learning?.at_risk || 0;
  const totalTracked = newCount + learningCount + masteredCount;

  const masteredPct = totalTracked > 0 ? (masteredCount / totalTracked) * 100 : 0;
  const learningPct = totalTracked > 0 ? (learningCount / totalTracked) * 100 : 0;
  const newPct = totalTracked > 0 ? (newCount / totalTracked) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-4">
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
      <div className="border-2 border-zinc-900 p-6 flex flex-col justify-between aspect-[2/1] col-span-2 bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] transition-transform">
        <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">{t('student.dashboard.totalAnswered')}</p>
        <p className="text-7xl md:text-8xl font-black tracking-tighter leading-none text-zinc-900">{analytics?.total_questions_answered || 0}</p>
      </div>
      
      {sm2 && (
        <div className="border-2 border-zinc-900 p-6 flex flex-col gap-4 bg-white col-span-2 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] transition-transform">
          <div className="border-b-2 border-zinc-900 pb-2 flex justify-between items-end">
            <div>
              <span className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 block">
                {t('student.dashboard.memoryEngineSubtitle', 'TRẠNG THÁI GHI NHỚ DÀI HẠN')}
              </span>
              <h3 className="font-black uppercase tracking-tighter text-xl text-zinc-900">
                {t('student.dashboard.memoryEngine')}
              </h3>
            </div>
            {totalTracked > 0 && (
              <span className="font-black text-sm uppercase tracking-widest text-indigo-600">
                {Math.round(masteredPct)}% {t('student.dashboard.masteredTag', 'THÀNH THẠO')}
              </span>
            )}
          </div>

          {/* Segmented Progress Bar */}
          {totalTracked > 0 && (
            <div className="w-full h-3 border-2 border-zinc-900 bg-zinc-100 flex overflow-hidden">
              <div style={{ width: `${masteredPct}%` }} className="bg-indigo-600 h-full" title={`Nhớ sâu: ${masteredCount}`} />
              <div style={{ width: `${learningPct}%` }} className="bg-zinc-800 h-full" title={`Đang ôn: ${learningCount}`} />
              <div style={{ width: `${newPct}%` }} className="bg-zinc-300 h-full" title={`Chưa học: ${newCount}`} />
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="border-r-2 border-zinc-900 pr-2 flex flex-col items-center">
              <span className="font-bold uppercase tracking-widest text-[10px] text-zinc-500">{t('student.dashboard.new')}</span>
              <span className="text-2xl font-black tracking-tighter">{newCount}</span>
            </div>
            <div className="border-r-2 border-zinc-900 px-2 flex flex-col items-center">
              <span className="font-bold uppercase tracking-widest text-[10px] text-zinc-500">{t('student.dashboard.learning')}</span>
              <span className="text-2xl font-black tracking-tighter text-zinc-800">{learningCount}</span>
            </div>
            <div className="pl-2 flex flex-col items-center">
              <span className="font-bold uppercase tracking-widest text-[10px] text-zinc-500">{t('student.dashboard.mastered')}</span>
              <span className="text-2xl font-black tracking-tighter text-indigo-600">{masteredCount}</span>
            </div>
          </div>

          {atRiskCount > 0 ? (
            <div className="bg-red-600 text-white font-black text-xs uppercase tracking-wider p-2 text-center border-2 border-zinc-900 mt-1">
              {t('student.dashboard.questionsAtRiskAlert', { count: atRiskCount, defaultValue: `CÓ ${atRiskCount} CÂU HỎI SẮP QUÊN CẦN ÔN TẬP NGAY` })}
            </div>
          ) : learningCount > 0 ? (
            <div className="bg-indigo-50 text-indigo-900 font-bold text-xs uppercase tracking-wider p-2 text-center border-2 border-indigo-600 mt-1">
              {t('student.dashboard.questionsLearningNote', { count: learningCount, defaultValue: `${learningCount} câu đang trong tiến trình ghi nhớ tốt` })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Users, BookOpen, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SystemMetrics } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  metrics: SystemMetrics | null;
  loading: boolean;
}

export const MetricCards: React.FC<Props> = ({ metrics, loading }) => {
  const { t } = useTranslation();

  if (loading || !metrics) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse h-80 flex items-center justify-center">
        <div className="w-36 h-36 rounded-full border-4 border-slate-200" />
      </div>
    );
  }

  const studentsCount = metrics.users.byRole.student || 0;
  const teachersCount = metrics.users.byRole.teacher || 0;
  const adminsCount = metrics.users.byRole.admin || 0;
  const totalUsers = metrics.users.total || (studentsCount + teachersCount + adminsCount);

  const doughnutData = {
    labels: [
      t('adminAnalytics.metrics.student', 'Học sinh'),
      t('adminAnalytics.metrics.teacher', 'Giáo viên'),
      t('adminAnalytics.metrics.admin', 'Quản trị viên'),
    ],
    datasets: [
      {
        data: [studentsCount, teachersCount, adminsCount],
        backgroundColor: ['#10b981', '#3b82f6', '#6366f1'],
        hoverBackgroundColor: ['#059669', '#2563eb', '#4f46e5'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: "'Inter', sans-serif", size: 12, weight: 700 },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const val = context.parsed;
            const pct = totalUsers > 0 ? Math.round((val / totalUsers) * 100) : 0;
            return ` ${context.label}: ${val} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
              {t('adminAnalytics.metrics.usersDistribution', 'Phân Bổ Người Dùng')}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">
              {t('adminAnalytics.metrics.totalRegistered', 'Tổng tài khoản hệ thống')}
            </p>
          </div>
        </div>
      </div>

      {/* Doughnut Chart with centered Total Count */}
      <div className="relative my-4 flex items-center justify-center h-44">
        <Doughnut data={doughnutData} options={doughnutOptions} />
        <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-2xl font-black text-slate-900 leading-none">{totalUsers}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            {t('adminAnalytics.metrics.users', 'Người Dùng')}
          </span>
        </div>
      </div>

      {/* Role Legend Bar */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-700 uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t('adminAnalytics.metrics.student', 'Học sinh')}</span>
          </div>
          <div className="text-sm font-black text-emerald-950 mt-0.5">{studentsCount}</div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-700 uppercase">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{t('adminAnalytics.metrics.teacher', 'Giáo viên')}</span>
          </div>
          <div className="text-sm font-black text-blue-950 mt-0.5">{teachersCount}</div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-indigo-700 uppercase">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>{t('adminAnalytics.metrics.admin', 'Quản trị viên')}</span>
          </div>
          <div className="text-sm font-black text-indigo-950 mt-0.5">{adminsCount}</div>
        </div>
      </div>

      {/* Quick Content Summary Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>{t('adminAnalytics.metrics.totalQuestions', 'Câu hỏi')}: <strong className="text-slate-900 font-mono">{metrics.content.questions}</strong></span>
        </span>
        <span className="flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
          <span>{t('adminAnalytics.metrics.classes', 'Lớp học')}: <strong className="text-slate-900 font-mono">{metrics.content.classes}</strong></span>
        </span>
      </div>
    </div>
  );
};

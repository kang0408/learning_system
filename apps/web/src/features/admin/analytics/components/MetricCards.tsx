import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
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
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 animate-pulse h-80 flex items-center justify-center">
        <div className="w-36 h-36 rounded-full border-4 border-slate-100" />
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
        backgroundColor: ['#10b981', '#0ea5e9', '#64748b'],
        hoverBackgroundColor: ['#059669', '#0284c7', '#475569'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
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
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t('adminAnalytics.metrics.usersDistribution', 'Phân Bổ Người Dùng')}
          </h3>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">
            {t('adminAnalytics.metrics.totalRegistered', 'Tổng tài khoản hệ thống')}
          </p>
        </div>
      </div>

      {/* Doughnut Chart with centered Total Count */}
      <div className="relative my-4 flex items-center justify-center h-44">
        <Doughnut data={doughnutData} options={doughnutOptions} />
        <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-3xl font-bold font-mono text-slate-900 leading-none">{totalUsers}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
            {t('adminAnalytics.metrics.users', 'Người Dùng')}
          </span>
        </div>
      </div>

      {/* Role Legend Bar */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t('adminAnalytics.metrics.student', 'Học sinh')}</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-900 mt-1">{studentsCount}</div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>{t('adminAnalytics.metrics.teacher', 'Giáo viên')}</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-900 mt-1">{teachersCount}</div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>{t('adminAnalytics.metrics.admin', 'Admin')}</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-900 mt-1">{adminsCount}</div>
        </div>
      </div>

      {/* Quick Content Summary Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          {t('adminAnalytics.metrics.totalQuestions', 'Câu hỏi')}: <strong className="text-slate-900 font-mono font-bold">{metrics.content.questions}</strong>
        </span>
        <span>
          {t('adminAnalytics.metrics.classes', 'Lớp học')}: <strong className="text-slate-900 font-mono font-bold">{metrics.content.classes}</strong>
        </span>
      </div>
    </div>
  );
};


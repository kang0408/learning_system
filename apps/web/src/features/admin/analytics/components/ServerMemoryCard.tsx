import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Server, HardDrive, Cpu, Clock, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SystemMetrics } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  metrics: SystemMetrics | null;
  loading: boolean;
}

interface MemoryPoint {
  time: string;
  heapUsedMB: number;
  heapTotalMB: number;
}

export const ServerMemoryCard: React.FC<Props> = ({ metrics, loading }) => {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<MemoryPoint[]>([]);

  useEffect(() => {
    if (metrics?.server?.memory) {
      const now = new Date();
      const currentLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
      const timeStr = now.toLocaleTimeString(currentLocale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newPoint: MemoryPoint = {
        time: timeStr,
        heapUsedMB: metrics.server.memory.heapUsedMB,
        heapTotalMB: metrics.server.memory.heapTotalMB,
      };

      setHistory((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
          return prev;
        }
        const updated = [...prev, newPoint];
        return updated.slice(-15);
      });
    }
  }, [metrics, i18n.language]);

  if (loading || !metrics) {
    return <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse h-80" />;
  }

  const { memory, uptimeSeconds, cpuUsageUserMs, cpuUsageSystemMs, nodeVersion, platform } = metrics.server;
  const heapPct = Math.min(100, Math.round((memory.heapUsedMB / memory.heapTotalMB) * 100));

  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const mins = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeString = `${days}d ${hours}h ${mins}m`;

  const currentLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  const chartLabels = history.length > 0 ? history.map((h) => h.time) : [new Date().toLocaleTimeString(currentLocale)];
  const chartDataPoints = history.length > 0 ? history.map((h) => h.heapUsedMB) : [memory.heapUsedMB];
  const chartWarningThreshold = history.length > 0 ? history.map((h) => Math.round(h.heapTotalMB * 0.85)) : [Math.round(memory.heapTotalMB * 0.85)];

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('adminAnalytics.serverMemory.heapUsed', 'RAM Đang Dùng'),
        data: chartDataPoints,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3.5,
      },
      {
        label: t('adminAnalytics.serverMemory.threshold85', 'Ngưỡng cảnh báo 85%'),
        data: chartWarningThreshold,
        borderColor: 'rgba(239, 68, 68, 0.6)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
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
          label: (context: any) => ` ${context.dataset.label}: ${context.parsed.y} MB`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: '600' }, color: '#94a3b8', maxRotation: 0 },
      },
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: {
          font: { size: 10, weight: '600' },
          color: '#94a3b8',
          callback: (value: any) => `${value} MB`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
              {t('adminAnalytics.serverMemory.title', 'Hiệu Năng Máy Chủ')}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">
              {t('adminAnalytics.serverMemory.subtitle', 'Bộ nhớ RAM Heap & Thời gian CPU theo thời gian thực')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('adminAnalytics.serverMemory.uptime', 'Thời gian hoạt động')}: {uptimeString}</span>
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="my-4 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <HardDrive className="w-4 h-4 text-indigo-600" />
            <span>{t('adminAnalytics.serverMemory.chartTitle', 'Biểu đồ bộ nhớ RAM Heap')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {memory.heapUsedMB} MB
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              / {memory.heapTotalMB} MB ({heapPct}%)
            </span>
          </div>
        </div>
        <div className="h-36 w-full">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* CPU & Node Runtime Footer */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-500 shrink-0" />
          <div>
            <span className="text-[10px] uppercase text-slate-400 block">
              {t('adminAnalytics.serverMemory.cpuTime', 'Thời gian CPU')}
            </span>
            <strong className="text-slate-900 font-mono">
              {Math.round(cpuUsageUserMs / 1000)}s / {Math.round(cpuUsageSystemMs / 1000)}s
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 block">
              {t('adminAnalytics.serverMemory.runtime', 'Môi trường thực thi')}
            </span>
            <strong className="text-slate-900 font-mono">{nodeVersion} - {platform}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

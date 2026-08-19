import React, { useState, useEffect } from 'react';
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
import { Cpu, Server, HardDrive, Clock, TrendingUp } from 'lucide-react';
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
      const timeStr = now.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newPoint: MemoryPoint = {
        time: timeStr,
        heapUsedMB: metrics.server.memory.heapUsedMB,
        heapTotalMB: metrics.server.memory.heapTotalMB,
      };

      setHistory(prev => {
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

  const { memory, uptimeSeconds, nodeVersion, platform, cpuUsageUserMs, cpuUsageSystemMs } = metrics.server;

  // Calculate percentage of Heap Used vs Heap Total
  const heapPct = Math.min(100, Math.round((memory.heapUsedMB / memory.heapTotalMB) * 100));

  // Format Uptime
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const mins = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeString = `${days > 0 ? `${days} ${t('adminAnalytics.serverMemory.days')} ` : ''}${hours}h ${mins}m`;

  const currentLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  // Chart Data
  const chartLabels = history.length > 0 ? history.map(h => h.time) : [new Date().toLocaleTimeString(currentLocale)];
  const chartDataPoints = history.length > 0 ? history.map(h => h.heapUsedMB) : [memory.heapUsedMB];

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('adminAnalytics.serverMemory.chartDataset'),
        data: chartDataPoints,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
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
        displayColors: false,
        callbacks: {
          label: (context: any) => ` RAM Heap: ${context.parsed.y} MB`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10, weight: '600' },
          color: '#94a3b8',
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(226, 232, 240, 0.6)',
        },
        ticks: {
          font: { size: 10, weight: '600' },
          color: '#94a3b8',
          callback: (value: any) => `${value} MB`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{t('adminAnalytics.serverMemory.title')}</h3>
            <p className="text-xs font-semibold text-slate-500">{t('adminAnalytics.serverMemory.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
            <Clock className="w-4 h-4 text-slate-500" /> {t('adminAnalytics.serverMemory.uptime')} {uptimeString}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Line Chart Section for RAM Heap Used */}
        <div className="lg:col-span-2 space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">{t('adminAnalytics.serverMemory.chartTitle')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                <TrendingUp className="w-3.5 h-3.5" />
                {memory.heapUsedMB} MB
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                / {memory.heapTotalMB} MB ({heapPct}%)
              </span>
            </div>
          </div>

          {/* Line Chart Container */}
          <div className="h-44 w-full pt-2">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1 border-t border-slate-200/60">
            <span>{t('adminAnalytics.serverMemory.rss')} <strong className="text-slate-900">{memory.rssMB} MB</strong></span>
            <span>{t('adminAnalytics.serverMemory.ramStatus')} <strong className={heapPct > 85 ? 'text-rose-600' : 'text-emerald-600'}>{heapPct > 85 ? t('adminAnalytics.serverMemory.alarm') : t('adminAnalytics.serverMemory.good')}</strong></span>
          </div>
        </div>

        {/* CPU & Node Runtime Specs */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 flex-1 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-500" /> {t('adminAnalytics.serverMemory.cpuTime')}
            </span>
            <div className="my-2 text-xl font-black text-slate-900">
              {Math.round(cpuUsageUserMs / 1000)}s <span className="text-xs font-semibold text-slate-400">/ {Math.round(cpuUsageSystemMs / 1000)}s</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">{t('adminAnalytics.serverMemory.cpuDesc')}</span>
          </div>

          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 flex-1 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-purple-500" /> {t('adminAnalytics.serverMemory.nodeEnv')}
            </span>
            <div className="my-2 text-lg font-black text-slate-900 truncate">
              {nodeVersion}
            </div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">{platform}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

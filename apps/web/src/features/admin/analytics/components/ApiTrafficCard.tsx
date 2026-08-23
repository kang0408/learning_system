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
import { Globe, Gauge, ShieldCheck, Radio } from 'lucide-react';
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

interface TrafficPoint {
  time: string;
  rps: number;
  latencyMs: number;
}

export const ApiTrafficCard: React.FC<Props> = ({ metrics, loading }) => {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<TrafficPoint[]>([]);

  useEffect(() => {
    if (metrics?.apiTraffic) {
      const now = new Date();
      const currentLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
      const timeStr = now.toLocaleTimeString(currentLocale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newPoint: TrafficPoint = {
        time: timeStr,
        rps: metrics.apiTraffic.rps || 0,
        latencyMs: metrics.apiTraffic.p95LatencyMs || 15,
      };

      setHistory((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
          return prev;
        }
        const updated = [...prev, newPoint];
        return updated.slice(-12);
      });
    }
  }, [metrics, i18n.language]);

  if (loading || !metrics) {
    return <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse h-80" />;
  }

  const traffic = metrics.apiTraffic || {
    rps: 0,
    totalRequests1m: 0,
    statusCodes: { '2xx': 0, '4xx': 0, '5xx': 0 },
    p95LatencyMs: 15,
    activeSseConnections: 1,
    status: 'HEALTHY' as const,
  };

  const totalCodes = Math.max(1, traffic.statusCodes['2xx'] + traffic.statusCodes['4xx'] + traffic.statusCodes['5xx']);
  const pct2xx = Math.round((traffic.statusCodes['2xx'] / totalCodes) * 100) || (traffic.totalRequests1m === 0 ? 100 : 0);
  const pct4xx = Math.round((traffic.statusCodes['4xx'] / totalCodes) * 100);
  const pct5xx = Math.round((traffic.statusCodes['5xx'] / totalCodes) * 100);

  const currentLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  const chartLabels = history.length > 0 ? history.map((h) => h.time) : [new Date().toLocaleTimeString(currentLocale)];
  const chartRpsData = history.length > 0 ? history.map((h) => h.rps) : [traffic.rps];

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('adminAnalytics.apiTraffic.rps', 'Tốc độ xử lý'),
        data: chartRpsData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3.5,
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
          label: (context: any) => ` ${t('adminAnalytics.apiTraffic.rps', 'Tốc độ')}: ${context.parsed.y} req/s`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: '600' }, color: '#94a3b8' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { font: { size: 10, weight: '600' }, color: '#94a3b8' },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
              {t('adminAnalytics.apiTraffic.title', 'Lưu Lượng & Tốc Độ API')}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">
              {t('adminAnalytics.apiTraffic.subtitle', 'Giám sát request realtime theo thời gian')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            {traffic.status}
          </span>
        </div>
      </div>

      {/* Area Chart Container */}
      <div className="my-4 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">{t('adminAnalytics.apiTraffic.rps', 'Tốc độ xử lý')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {traffic.rps} rps
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {t('adminAnalytics.apiTraffic.p95', 'Độ trễ P95')}: <strong className="text-slate-700">{traffic.p95LatencyMs}ms</strong>
            </span>
          </div>
        </div>
        <div className="h-36 w-full">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* HTTP Status Code Meter Bar */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500 uppercase tracking-wider text-[10px]">{t('adminAnalytics.apiTraffic.statusDist', 'Phân bổ mã trạng thái HTTP')}</span>
          <span className="text-emerald-700 font-mono">2xx: {pct2xx}% | 4xx: {pct4xx}% | 5xx: {pct5xx}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
          <div style={{ width: `${pct2xx}%` }} className="bg-emerald-500 transition-all duration-500" title={`2xx: ${pct2xx}%`} />
          <div style={{ width: `${pct4xx}%` }} className="bg-amber-500 transition-all duration-500" title={`4xx: ${pct4xx}%`} />
          <div style={{ width: `${pct5xx}%` }} className="bg-rose-500 transition-all duration-500" title={`5xx: ${pct5xx}%`} />
        </div>

        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('adminAnalytics.apiTraffic.sseConnections', 'Kết nối SSE')}: <strong className="text-slate-900 font-mono">{traffic.activeSseConnections} {t('adminAnalytics.apiTraffic.active', 'hoạt động')}</strong></span>
          </span>
          <span>{t('adminAnalytics.apiTraffic.lastMinute', '1 phút qua')}: <strong className="text-slate-900 font-mono">{traffic.totalRequests1m} {t('adminAnalytics.apiTraffic.req', 'yêu cầu')}</strong></span>
        </div>
      </div>
    </div>
  );
};

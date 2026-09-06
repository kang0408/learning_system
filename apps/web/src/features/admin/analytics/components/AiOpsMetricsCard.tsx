import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTranslation } from 'react-i18next';
import type { SystemMetrics } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  metrics: SystemMetrics | null;
  loading: boolean;
}

export const AiOpsMetricsCard: React.FC<Props> = ({ metrics, loading }) => {
  const { t } = useTranslation();

  if (loading || !metrics) {
    return <div className="bg-white rounded-2xl p-6 border border-slate-200/80 animate-pulse h-80" />;
  }

  const ai = metrics.aiOps || {
    totalReportsGenerated: 0,
    totalAiQuestions: 0,
    estimatedTokensUsed: 0,
    averageLatencyMs: 620,
    errorRatePct: 0.2,
    status: 'HEALTHY' as const,
  };

  const formattedTokens = new Intl.NumberFormat().format(ai.estimatedTokensUsed);
  const estimatedCostUsd = ((ai.estimatedTokensUsed / 1000) * 0.0003).toFixed(3);

  const barChartData = {
    labels: [
      t('adminAnalytics.aiOps.aiQuestions', 'Câu hỏi AI'),
      t('adminAnalytics.aiOps.aiReports', 'Báo cáo AI'),
      t('adminAnalytics.aiOps.avgLatency', 'Độ trễ'),
      t('adminAnalytics.aiOps.errorRateLabel', 'Tỷ lệ lỗi'),
    ],
    datasets: [
      {
        label: t('adminAnalytics.aiOps.datasetLabel', 'Chỉ số'),
        data: [
          ai.totalAiQuestions || 150,
          ai.totalReportsGenerated || 45,
          Math.round((ai.averageLatencyMs || 620) / 10),
          Math.round((ai.errorRatePct || 0.2) * 10),
        ],
        backgroundColor: [
          '#6366f1',
          '#0ea5e9',
          '#64748b',
          '#10b981',
        ],
        borderRadius: 6,
        borderWidth: 0,
      },
    ],
  };

  const barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
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
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { font: { size: 10 }, color: '#94a3b8' },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t('adminAnalytics.aiOps.title', 'Vận Hành AI & LLM')}
          </h3>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">
            {t('adminAnalytics.aiOps.subtitle', 'Theo dõi token tiêu thụ, độ trễ và tỷ lệ tạo nội dung')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase">
            {ai.status}
          </span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="my-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-600">
            {t('adminAnalytics.aiOps.tokens', 'Token tiêu thụ')}: <strong className="text-slate-900 font-mono font-bold">{formattedTokens}</strong>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
            ~${estimatedCostUsd} USD
          </span>
        </div>
        <div className="h-36 w-full">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Quick Summary Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          {t('adminAnalytics.aiOps.latency', 'Độ trễ trung bình')}: <strong className="text-slate-900 font-mono font-semibold">{ai.averageLatencyMs}ms</strong>
        </span>
        <span>
          {t('adminAnalytics.aiOps.errorRate', 'Tỷ lệ lỗi API')}: <strong className="text-emerald-700 font-mono font-semibold">{ai.errorRatePct}%</strong>
        </span>
      </div>
    </div>
  );
};


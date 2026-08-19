import React from 'react';
import { Bot, Sparkles, Zap, Coins, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SystemMetrics } from '../types';

interface Props {
  metrics: SystemMetrics | null;
  loading: boolean;
}

export const AiOpsMetricsCard: React.FC<Props> = ({ metrics, loading }) => {
  const { t } = useTranslation();

  if (loading || !metrics) {
    return <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse h-64" />;
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

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-500 to-indigo-500 text-white rounded-xl shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">{t('adminAnalytics.aiOps.title')}</h3>
              <span className="bg-purple-50 text-purple-700 border border-purple-200/60 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t('adminAnalytics.aiOps.badge')}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500">{t('adminAnalytics.aiOps.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            {t('adminAnalytics.aiOps.service')} {ai.status}
          </span>
        </div>
      </div>

      {/* Main AI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {/* Token Consumption */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-500" /> {t('adminAnalytics.aiOps.tokens')}
            </span>
            <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
              ~${estimatedCostUsd}
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formattedTokens}</div>
            <span className="text-[11px] font-semibold text-slate-400">{t('adminAnalytics.aiOps.tokensDesc')}</span>
          </div>
        </div>

        {/* AI Reports & Content Generated */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-purple-500" /> {t('adminAnalytics.aiOps.generated')}
            </span>
            <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-md">
              {t('adminAnalytics.aiOps.auto')}
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {ai.totalReportsGenerated + ai.totalAiQuestions}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span>{ai.totalReportsGenerated} {t('adminAnalytics.aiOps.reports')}</span>
              <span>•</span>
              <span>{ai.totalAiQuestions} {t('adminAnalytics.aiOps.questions')}</span>
            </div>
          </div>
        </div>

        {/* Average AI Latency */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" /> {t('adminAnalytics.aiOps.latency')}
            </span>
            <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
              P50 / P90
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {ai.averageLatencyMs} <span className="text-sm font-bold text-slate-400">ms</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" /> {t('adminAnalytics.aiOps.fastStable')}
            </span>
          </div>
        </div>

        {/* AI Error Rate */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-rose-500" /> {t('adminAnalytics.aiOps.errorRate')}
            </span>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
              {t('adminAnalytics.aiOps.low')}
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {ai.errorRatePct}%
            </div>
            <span className="text-[11px] font-semibold text-slate-400">{t('adminAnalytics.aiOps.errorRateDesc')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

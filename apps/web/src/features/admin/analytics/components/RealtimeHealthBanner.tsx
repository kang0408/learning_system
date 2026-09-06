import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SystemMetrics, SubsystemCheck } from '../types';

interface Props {
  metrics: SystemMetrics | null;
  isLiveStream: boolean;
  loading: boolean;
}

export const RealtimeHealthBanner: React.FC<Props> = ({ metrics, isLiveStream, loading }) => {
  const { t, i18n } = useTranslation();

  if (loading || !metrics) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 animate-pulse flex items-center justify-between">
        <div className="h-5 w-48 bg-slate-100 rounded-lg" />
        <div className="h-5 w-32 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  const isHealthy = metrics.status === 'HEALTHY';
  const isWarning = metrics.status === 'WARNING';

  const currentLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  const formattedTime = new Date(metrics.timestamp).toLocaleTimeString(currentLocale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const getSubsystemIndicator = (name: string, check?: SubsystemCheck, value?: string) => {
    const status = check?.status || 'HEALTHY';
    let dotClass = 'bg-emerald-500';

    if (status === 'WARNING') {
      dotClass = 'bg-amber-500';
    } else if (status === 'CRITICAL') {
      dotClass = 'bg-rose-500';
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
        <span className="font-medium text-slate-600">{name}</span>
        {value && <span className="font-mono font-semibold text-slate-900 ml-0.5">{value}</span>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Left side: System status & timestamp */}
      <div className="flex items-center gap-3.5">
        <span className="relative flex h-3 w-3">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isHealthy ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-rose-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-3 w-3 ${
            isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
          }`} />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {t('adminAnalytics.banner.systemStatus')}
            </span>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md uppercase ${
              isHealthy
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : isWarning
                ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60'
            }`}>
              {metrics.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {t('adminAnalytics.banner.lastUpdated')} <span className="font-mono text-slate-600 font-semibold">{formattedTime}</span>
          </p>
        </div>
      </div>

      {/* Middle & Right side: Subsystem chips & Live stream badge */}
      <div className="flex flex-wrap items-center gap-2">
        {getSubsystemIndicator(
          'PostgreSQL',
          metrics.checks?.database,
          `${metrics.database?.latencyMs || metrics.checks?.database?.latencyMs || 5}ms`
        )}
        {getSubsystemIndicator(
          'Node Runtime',
          metrics.checks?.memory,
          `${metrics.server?.memory?.heapUsagePct || Math.round((metrics.server.memory.heapUsedMB / metrics.server.memory.heapTotalMB) * 100)}%`
        )}
        {getSubsystemIndicator(
          'Gemini AI',
          metrics.checks?.ai,
          `${metrics.aiOps?.averageLatencyMs || 620}ms`
        )}
        {getSubsystemIndicator(
          'API Gateway',
          metrics.checks?.api,
          `${metrics.apiTraffic?.rps || 0} rps`
        )}

        <div className="ml-auto lg:ml-2">
          {isLiveStream ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-mono font-medium shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE SSE</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>SNAPSHOT</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


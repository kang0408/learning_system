import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, AlertOctagon, Radio, Database, Cpu, Bot, Globe } from 'lucide-react';
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
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 animate-pulse flex items-center justify-between">
        <div className="h-5 w-48 bg-slate-200 rounded-lg" />
        <div className="h-5 w-32 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  const isHealthy = metrics.status === 'HEALTHY';
  const isWarning = metrics.status === 'WARNING';
  const isCritical = metrics.status === 'CRITICAL';

  const currentLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  const formattedTime = new Date(metrics.timestamp).toLocaleTimeString(currentLocale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const getSubsystemBadge = (name: string, icon: React.ReactNode, check?: SubsystemCheck, extraText?: string) => {
    const status = check?.status || 'HEALTHY';
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    let dotClass = 'bg-emerald-500';

    if (status === 'WARNING') {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200/80';
      dotClass = 'bg-amber-500';
    } else if (status === 'CRITICAL') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200/80';
      dotClass = 'bg-rose-500';
    }

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${badgeClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        {icon}
        <span>{name}</span>
        {extraText && <span className="opacity-80 font-mono text-[11px] ml-0.5">{extraText}</span>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Left side: System status & timestamp */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-xl flex items-center justify-center border shadow-sm ${
            isHealthy
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : isWarning
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
          }`}
        >
          {isHealthy && <CheckCircle2 className="w-5 h-5" />}
          {isWarning && <AlertTriangle className="w-5 h-5" />}
          {isCritical && <AlertOctagon className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight text-slate-900">
              {t('adminAnalytics.banner.systemStatus')}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-black uppercase ${
                isHealthy
                  ? 'bg-emerald-100/70 text-emerald-800'
                  : isWarning
                  ? 'bg-amber-100/70 text-amber-800'
                  : 'bg-rose-100/70 text-rose-800'
              }`}
            >
              {metrics.status}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
            {t('adminAnalytics.banner.lastUpdated')} <span className="font-mono text-slate-600 font-bold">{formattedTime}</span>
          </p>
        </div>
      </div>

      {/* Middle & Right side: Subsystem chips & Live stream badge */}
      <div className="flex flex-wrap items-center gap-2">
        {getSubsystemBadge(
          'PostgreSQL',
          <Database className="w-3.5 h-3.5" />,
          metrics.checks?.database,
          `${metrics.database?.latencyMs || metrics.checks?.database?.latencyMs || 5}ms`
        )}
        {getSubsystemBadge(
          'Node Runtime',
          <Cpu className="w-3.5 h-3.5" />,
          metrics.checks?.memory,
          `${metrics.server?.memory?.heapUsagePct || Math.round((metrics.server.memory.heapUsedMB / metrics.server.memory.heapTotalMB) * 100)}%`
        )}
        {getSubsystemBadge(
          'Gemini AI',
          <Bot className="w-3.5 h-3.5" />,
          metrics.checks?.ai,
          `${metrics.aiOps?.averageLatencyMs || 620}ms`
        )}
        {getSubsystemBadge(
          'API Gateway',
          <Globe className="w-3.5 h-3.5" />,
          metrics.checks?.api,
          `${metrics.apiTraffic?.rps || 0} rps`
        )}

        <div className="ml-auto lg:ml-2">
          {isLiveStream ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Radio className="w-3 h-3 text-emerald-600" />
              <span>LIVE SSE</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
              <Activity className="w-3 h-3 text-slate-400" />
              <span>SNAPSHOT</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

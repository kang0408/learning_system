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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse flex items-center justify-between">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
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
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let dotClass = 'bg-emerald-500';

    if (status === 'WARNING') {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      dotClass = 'bg-amber-500';
    } else if (status === 'CRITICAL') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      dotClass = 'bg-rose-500';
    }

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${badgeClass}`}>
        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
        {icon}
        <span>{name}</span>
        {extraText && <span className="opacity-75 font-medium ml-0.5">({extraText})</span>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-center border shadow-sm ${
              isHealthy
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                : isWarning
                ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                : 'bg-rose-50 text-rose-600 border-rose-200/80 animate-pulse'
            }`}
          >
            {isHealthy && <CheckCircle2 className="w-7 h-7" />}
            {isWarning && <AlertTriangle className="w-7 h-7" />}
            {isCritical && <AlertOctagon className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                {t('adminAnalytics.banner.systemStatus')}{' '}
                <span
                  className={
                    isHealthy
                      ? 'text-emerald-600'
                      : isWarning
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }
                >
                  {metrics.status}
                </span>
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {t('adminAnalytics.banner.lastUpdated')}{' '}
              <span className="font-bold text-slate-700">{formattedTime}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLiveStream ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              {t('adminAnalytics.banner.liveSse')}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              {t('adminAnalytics.banner.restSnapshot')}
            </div>
          )}
        </div>
      </div>

      {/* Subsystem health indicators bar */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">
          {t('adminAnalytics.banner.subsystems')}
        </span>
        {getSubsystemBadge(
          t('adminAnalytics.banner.pgDb'),
          <Database className="w-3.5 h-3.5" />,
          metrics.checks?.database,
          `${metrics.database?.latencyMs || metrics.checks?.database?.latencyMs || 5}ms`
        )}
        {getSubsystemBadge(
          t('adminAnalytics.banner.nodeRam'),
          <Cpu className="w-3.5 h-3.5" />,
          metrics.checks?.memory,
          `${metrics.server?.memory?.heapUsagePct || Math.round((metrics.server.memory.heapUsedMB / metrics.server.memory.heapTotalMB) * 100)}%`
        )}
        {getSubsystemBadge(
          t('adminAnalytics.banner.aiEngine'),
          <Bot className="w-3.5 h-3.5" />,
          metrics.checks?.ai,
          `${metrics.aiOps?.averageLatencyMs || 620}ms`
        )}
        {getSubsystemBadge(
          t('adminAnalytics.banner.apiGateway'),
          <Globe className="w-3.5 h-3.5" />,
          metrics.checks?.api,
          `${metrics.apiTraffic?.rps || 0} req/s`
        )}
      </div>
    </div>
  );
};

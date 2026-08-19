import React from 'react';
import { Globe, Radio, Gauge, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SystemMetrics } from '../types';

interface Props {
  metrics: SystemMetrics | null;
  loading: boolean;
}

export const ApiTrafficCard: React.FC<Props> = ({ metrics, loading }) => {
  const { t } = useTranslation();

  if (loading || !metrics) {
    return <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse h-64" />;
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

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">{t('adminAnalytics.apiTraffic.title')}</h3>
              <span className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t('adminAnalytics.apiTraffic.badge')}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500">{t('adminAnalytics.apiTraffic.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('adminAnalytics.apiTraffic.gateway')} {traffic.status}
          </span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
        {/* RPS & Total 1m Requests */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-indigo-500" /> {t('adminAnalytics.apiTraffic.rps')}
            </span>
            <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
              Req / sec
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {traffic.rps} <span className="text-sm font-semibold text-slate-400">rps</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {t('adminAnalytics.apiTraffic.total1m', { count: traffic.totalRequests1m })}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">{t('adminAnalytics.apiTraffic.p95')}</span>
            <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {traffic.p95LatencyMs} ms
            </span>
          </div>
        </div>

        {/* HTTP Status Code Distribution */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('adminAnalytics.apiTraffic.statusDist')}</span>
            <span className="text-[11px] font-semibold text-slate-400">{t('adminAnalytics.apiTraffic.pct')}</span>
          </div>

          {/* Mini multi-color progress bar */}
          <div className="my-3 space-y-2">
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
              <div style={{ width: `${pct2xx}%` }} className="bg-emerald-500 transition-all duration-500" title={`2xx: ${pct2xx}%`} />
              <div style={{ width: `${pct4xx}%` }} className="bg-amber-500 transition-all duration-500" title={`4xx: ${pct4xx}%`} />
              <div style={{ width: `${pct5xx}%` }} className="bg-rose-500 transition-all duration-500" title={`5xx: ${pct5xx}%`} />
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] font-bold text-center">
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 py-1 rounded flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 2xx ({traffic.statusCodes['2xx']})
              </div>
              <div className="bg-amber-50 text-amber-700 border border-amber-200/60 py-1 rounded flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" /> 4xx ({traffic.statusCodes['4xx']})
              </div>
              <div className="bg-rose-50 text-rose-700 border border-rose-200/60 py-1 rounded flex items-center justify-center gap-1">
                <XCircle className="w-3 h-3 text-rose-600" /> 5xx ({traffic.statusCodes['5xx']})
              </div>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-slate-400 text-right">
            {t('adminAnalytics.apiTraffic.successRate')} <strong className="text-emerald-600">{pct2xx}%</strong>
          </div>
        </div>

        {/* Live SSE Realtime Subscribers */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-500" /> {t('adminAnalytics.apiTraffic.subscribers')}
            </span>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
              {t('adminAnalytics.apiTraffic.realtime')}
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1.5">
              {traffic.activeSseConnections}
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {t('adminAnalytics.apiTraffic.activeChannels')}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {t('adminAnalytics.apiTraffic.subscribersDesc')}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">{t('adminAnalytics.apiTraffic.frequency')}</span>
            <span className="font-extrabold text-slate-800">3000 ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

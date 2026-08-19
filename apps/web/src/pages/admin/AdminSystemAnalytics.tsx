import { useSystemAnalytics } from '../../features/admin/analytics/hooks/useSystemAnalytics';
import { RealtimeHealthBanner } from '../../features/admin/analytics/components/RealtimeHealthBanner';
import { MetricCards } from '../../features/admin/analytics/components/MetricCards';
import { ServerMemoryCard } from '../../features/admin/analytics/components/ServerMemoryCard';
import { AiOpsMetricsCard } from '../../features/admin/analytics/components/AiOpsMetricsCard';
import { ApiTrafficCard } from '../../features/admin/analytics/components/ApiTrafficCard';
import { DatabaseDeepCard } from '../../features/admin/analytics/components/DatabaseDeepCard';
import { Activity, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminSystemAnalytics() {
  const { t } = useTranslation();
  const { metrics, loading, isLiveStream, error } = useSystemAnalytics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {t('adminAnalytics.header.title')}
            </h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {t('adminAnalytics.header.subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between">
          <span className="text-sm font-bold">{t('adminAnalytics.header.error')}</span>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('adminAnalytics.header.reload')}
          </button>
        </div>
      )}

      {/* Realtime Health Banner */}
      <RealtimeHealthBanner metrics={metrics} isLiveStream={isLiveStream} loading={loading} />

      {/* 4 Cards Overview */}
      <MetricCards metrics={metrics} loading={loading} />

      {/* AI Operations & API Traffic Row */}
      <div className="grid grid-cols-1 gap-6">
        <AiOpsMetricsCard metrics={metrics} loading={loading} />
        <ApiTrafficCard metrics={metrics} loading={loading} />
        <DatabaseDeepCard metrics={metrics} loading={loading} />
      </div>

      {/* RAM & CPU Performance Metrics */}
      <ServerMemoryCard metrics={metrics} loading={loading} />
    </div>
  );
}

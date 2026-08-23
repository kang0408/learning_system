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
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {t('adminAnalytics.header.title', 'Giám Sát Hệ Thống & Hạ Tầng')}
            </h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {t('adminAnalytics.header.subtitle', 'Theo dõi realtime hiệu năng máy chủ, database, AI tokens và lưu lượng truy cập')}
          </p>
        </div>

        <div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('adminAnalytics.header.reload', 'Làm mới')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between">
          <span className="text-sm font-bold">{t('adminAnalytics.header.error', 'Không thể kết nối đến máy chủ giám sát')}</span>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('adminAnalytics.header.reload', 'Thử lại')}
          </button>
        </div>
      )}

      {/* Realtime Health Status Banner */}
      <RealtimeHealthBanner metrics={metrics} isLiveStream={isLiveStream} loading={loading} />

      {/* Row 1: Traffic Area Chart (Left) + Users Doughnut Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApiTrafficCard metrics={metrics} loading={loading} />
        <MetricCards metrics={metrics} loading={loading} />
      </div>

      {/* Row 2: AI Ops Bar Chart (Left) + Server Memory Line Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AiOpsMetricsCard metrics={metrics} loading={loading} />
        <ServerMemoryCard metrics={metrics} loading={loading} />
      </div>

      {/* Row 3: Full-width Database Performance Card */}
      <DatabaseDeepCard metrics={metrics} loading={loading} />
    </div>
  );
}

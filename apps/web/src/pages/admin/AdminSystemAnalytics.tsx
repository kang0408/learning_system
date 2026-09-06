import { useSystemAnalytics } from '../../features/admin/analytics/hooks/useSystemAnalytics';
import { RealtimeHealthBanner } from '../../features/admin/analytics/components/RealtimeHealthBanner';
import { MetricCards } from '../../features/admin/analytics/components/MetricCards';
import { ServerMemoryCard } from '../../features/admin/analytics/components/ServerMemoryCard';
import { AiOpsMetricsCard } from '../../features/admin/analytics/components/AiOpsMetricsCard';
import { ApiTrafficCard } from '../../features/admin/analytics/components/ApiTrafficCard';
import { DatabaseDeepCard } from '../../features/admin/analytics/components/DatabaseDeepCard';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminSystemAnalytics() {
  const { t } = useTranslation();
  const { metrics, loading, isLiveStream, error } = useSystemAnalytics();

  return (
    <div className="space-y-8 pb-12">
      {/* Header (Clean Typography-First) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t('adminAnalytics.header.title', 'Giám Sát Hệ Thống')}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isLiveStream ? 'Realtime' : 'Active'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            {t('adminAnalytics.header.subtitle', 'Theo dõi hiệu năng máy chủ, cơ sở dữ liệu, AI tokens và lưu lượng truy cập')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('adminAnalytics.header.reload', 'Làm mới')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50/80 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium">{t('adminAnalytics.header.error', 'Không thể kết nối đến máy chủ giám sát')}</span>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-50 transition-colors shadow-xs text-rose-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('adminAnalytics.header.reload', 'Thử lại')}
          </button>
        </div>
      )}

      {/* Realtime Health Status Strip */}
      <RealtimeHealthBanner metrics={metrics} isLiveStream={isLiveStream} loading={loading} />

      {/* Row 1: Traffic Area Chart (Left) + Users Doughnut Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <ApiTrafficCard metrics={metrics} loading={loading} />
        <MetricCards metrics={metrics} loading={loading} />
      </div>

      {/* Row 2: AI Ops Bar Chart (Left) + Server Memory Line Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <AiOpsMetricsCard metrics={metrics} loading={loading} />
        <ServerMemoryCard metrics={metrics} loading={loading} />
      </div>

      {/* Row 3: Full-width Database Performance Card */}
      <DatabaseDeepCard metrics={metrics} loading={loading} />
    </div>
  );
}


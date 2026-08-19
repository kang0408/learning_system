import { useSystemAnalytics } from '../../features/admin/analytics/hooks/useSystemAnalytics';
import { RealtimeHealthBanner } from '../../features/admin/analytics/components/RealtimeHealthBanner';
import { MetricCards } from '../../features/admin/analytics/components/MetricCards';
import { ServerMemoryCard } from '../../features/admin/analytics/components/ServerMemoryCard';
import { Activity, RefreshCw } from 'lucide-react';

export default function AdminSystemAnalytics() {
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Theo Dõi Hệ Thống Real-time</h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Giám sát tài nguyên máy chủ, kết nối cơ sở dữ liệu và lượt học tập trực tuyến tức thì
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between">
          <span className="text-sm font-bold">{error}</span>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tải lại
          </button>
        </div>
      )}

      {/* Realtime Health Banner */}
      <RealtimeHealthBanner metrics={metrics} isLiveStream={isLiveStream} loading={loading} />

      {/* 4 Cards Overview */}
      <MetricCards metrics={metrics} loading={loading} />

      {/* RAM & CPU Performance Metrics */}
      <ServerMemoryCard metrics={metrics} loading={loading} />
    </div>
  );
}

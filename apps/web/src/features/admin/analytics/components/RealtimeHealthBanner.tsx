import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';
import type { SystemMetrics } from '../types';

interface Props {
  metrics: SystemMetrics | null;
  isLiveStream: boolean;
  loading: boolean;
}

export const RealtimeHealthBanner: React.FC<Props> = ({ metrics, isLiveStream, loading }) => {
  if (loading || !metrics) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse flex items-center justify-between">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  const isHealthy = metrics.status === 'HEALTHY';
  const formattedTime = new Date(metrics.timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl flex items-center justify-center ${isHealthy ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-amber-50 text-amber-600 border border-amber-200/60'}`}>
          {isHealthy ? <CheckCircle2 className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Trạng thái Hệ thống: <span className={isHealthy ? 'text-emerald-600' : 'text-amber-600'}>{metrics.status}</span>
            </h2>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Cập nhật lúc: <span className="font-bold text-slate-700">{formattedTime}</span>
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
            Live SSE Stream (3s)
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            REST Snapshot Mode
          </div>
        )}
      </div>
    </div>
  );
};

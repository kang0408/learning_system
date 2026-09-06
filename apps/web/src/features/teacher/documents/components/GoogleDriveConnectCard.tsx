import React from 'react';
import { HardDrive, RefreshCw, Unplug, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { GoogleDriveAccount } from '../types/drive.types';

interface GoogleDriveConnectCardProps {
  account: GoogleDriveAccount;
  isLoading: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const GoogleDriveConnectCard: React.FC<GoogleDriveConnectCardProps> = ({
  account,
  isLoading,
  onConnect,
  onDisconnect,
  onRefresh,
}) => {
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const usagePercent =
    account.storageUsed && account.storageTotal
      ? Math.min(100, Math.max(1, Math.round((account.storageUsed / account.storageTotal) * 100)))
      : 0;

  if (!account.isConnected) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-xs text-center relative overflow-hidden">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
            <HardDrive className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Chưa liên kết tài khoản Google Drive
            </h2>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed font-normal">
              Kết nối Google Drive cá nhân để lưu trữ tài liệu giáo án không giới hạn, đồng bộ file trực tiếp vào bài học và phân quyền xem cho học sinh.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onConnect()}
              disabled={isLoading}
              className="shadow-xs font-bold"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
                  alt="Google Drive"
                  className="w-4 h-4 mr-2"
                />
              )}
              {isLoading ? 'Đang kết nối...' : 'Liên kết Google Drive ngay'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Account Info */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 relative shadow-xs">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
              alt="Google Drive"
              className="w-5 h-5 object-contain"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-white" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 truncate">
                {account.displayName || 'Google Drive đã kết nối'}
              </span>
              <Badge variant="success" size="sm" className="font-semibold text-[11px]">
                Đang kết nối
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
              {account.email}
            </p>
          </div>
        </div>

        {/* Storage Progress Meter */}
        <div className="flex-1 max-w-md bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-200/60">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-600 flex items-center gap-1.5">
              <span>Dung lượng Drive:</span>
              {onRefresh && (
                <button
                  type="button"
                  onClick={() => onRefresh()}
                  disabled={isLoading}
                  title="Đồng bộ lại dung lượng"
                  className="p-0.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
              )}
            </span>
            <span className="text-slate-900 font-mono text-xs">
              {formatBytes(account.storageUsed)} / {formatBytes(account.storageTotal || 15 * 1024 * 1024 * 1024)} ({usagePercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                usagePercent > 85 ? 'bg-rose-500' : usagePercent > 65 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.max(usagePercent, account.storageUsed ? 1 : 0)}%` }}
            />
          </div>
        </div>

        {/* Disconnect Action */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            disabled={isLoading}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 border-slate-200"
          >
            <Unplug className="w-3.5 h-3.5 mr-1.5" />
            Hủy liên kết
          </Button>
        </div>
      </div>
    </div>
  );
};

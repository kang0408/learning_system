import React from 'react';
import { HardDrive, RefreshCw, Unplug, ShieldCheck } from 'lucide-react';
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
      <div className="bg-white rounded-3xl border border-indigo-100 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-50/70 via-purple-50/30 to-transparent rounded-full pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100/80">
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
              Tích hợp Google Drive
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Kết nối Google Drive để lưu trữ và quản lý giáo án
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed font-normal">
              Lưu trữ tài liệu trực tiếp trên Google Drive cá nhân của bạn mà không chiếm dung lượng máy chủ. Bạn có thể chủ động bật quyền xem công khai để học sinh mở xem trực tiếp trên bài học hoặc giữ riêng tư cho tài liệu nội bộ.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Bảo mật OAuth 2.0
              </span>
              <span>•</span>
              <span>Chỉ chia sẻ file bạn cho phép</span>
              <span>•</span>
              <span>Tích hợp trực tiếp vào lộ trình lớp học</span>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onConnect()}
              disabled={isLoading}
              className="shadow-sm font-bold"
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
              {isLoading ? 'Đang kết nối...' : 'Liên kết Google Drive'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Account Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 relative shadow-xs">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
              alt="Google Drive"
              className="w-6 h-6 object-contain"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base text-slate-900">
                {account.displayName || 'Google Drive đã kết nối'}
              </span>
              <Badge variant="success" size="sm" className="font-semibold">
                Đang kết nối
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              {account.email}
            </p>
          </div>
        </div>

        {/* Storage Progress Meter */}
        <div className="flex-1 max-w-md bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
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
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                usagePercent > 85 ? 'bg-rose-500' : usagePercent > 65 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.max(usagePercent, account.storageUsed ? 1 : 0)}%` }}
            />
          </div>
        </div>

        {/* Disconnect Action */}
        <div className="flex items-center gap-3 shrink-0">
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

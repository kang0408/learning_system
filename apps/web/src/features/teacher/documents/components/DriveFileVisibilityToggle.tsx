import React from 'react';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface DriveFileVisibilityToggleProps {
  isPublic: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  compact?: boolean;
}

export const DriveFileVisibilityToggle: React.FC<DriveFileVisibilityToggleProps> = ({
  isPublic,
  isLoading = false,
  onToggle,
  compact = false,
}) => {
  return (
    <div className="inline-flex items-center gap-2">
      {/* Clean Modern Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isPublic}
        disabled={isLoading}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          isPublic ? 'bg-emerald-500' : 'bg-slate-200'
        } ${isLoading ? 'opacity-60 cursor-wait' : ''}`}
        title={isPublic ? 'Chuyển sang Riêng tư' : 'Chuyển sang Công khai xem'}
      >
        <span className="sr-only">Chuyển đổi quyền xem</span>
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
            isPublic ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>

      {/* Status Badge */}
      {!compact && (
        <button
          type="button"
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="cursor-pointer select-none transition-opacity"
        >
          {isLoading ? (
            <Badge variant="secondary" size="sm" className="gap-1.5 font-semibold text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              <span>Đang lưu...</span>
            </Badge>
          ) : isPublic ? (
            <Badge variant="success" size="sm" className="gap-1.5 font-semibold hover:bg-emerald-100 transition-colors">
              <Globe className="w-3 h-3 text-emerald-600" />
              <span>Công khai xem</span>
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm" className="gap-1.5 font-semibold hover:bg-slate-200 transition-colors text-slate-600">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Riêng tư</span>
            </Badge>
          )}
        </button>
      )}
    </div>
  );
};

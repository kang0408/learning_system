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
    <div className="flex items-center gap-2">
      {/* Switch Button */}
      <button
        type="button"
        role="switch"
        aria-checked={isPublic}
        disabled={isLoading}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          isPublic ? 'bg-emerald-500' : 'bg-slate-300'
        } ${isLoading ? 'opacity-60 cursor-wait' : ''}`}
        title={isPublic ? 'Chuyển sang Riêng tư' : 'Chuyển sang Công khai xem'}
      >
        <span className="sr-only">Chuyển đổi quyền xem</span>
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out flex items-center justify-center ${
            isPublic ? 'translate-x-4' : 'translate-x-0'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-600" />
          ) : isPublic ? (
            <Globe className="w-2.5 h-2.5 text-emerald-600" />
          ) : (
            <Lock className="w-2.5 h-2.5 text-slate-400" />
          )}
        </span>
      </button>

      {/* Status Badge */}
      {!compact && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="cursor-pointer select-none"
        >
          {isPublic ? (
            <Badge variant="success" size="sm" className="gap-1 font-medium hover:bg-emerald-100 transition-colors">
              <Globe className="w-3 h-3" />
              <span>Công khai xem</span>
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm" className="gap-1 font-medium hover:bg-slate-200 transition-colors">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Riêng tư</span>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

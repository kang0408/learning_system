import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  isPending: boolean;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, total, limit, isPending, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between p-6 border-t-4 border-zinc-900 bg-white">
      <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-wider text-zinc-600">
        <span>
          Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trong {total}
        </span>
        {isPending && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
      </div>
      <div className="flex space-x-4">
        <button 
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1 || isPending}
          className="p-3 border-2 border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || isPending}
          className="p-3 border-2 border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

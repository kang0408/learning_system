import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
  children: React.ReactNode;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  side = 'left',
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sides = {
    left: 'left-0 top-0 bottom-0 h-full w-3/4 max-w-sm border-r slide-in-from-left',
    right: 'right-0 top-0 bottom-0 h-full w-3/4 max-w-sm border-l slide-in-from-right',
    top: 'top-0 left-0 right-0 w-full border-b slide-in-from-top',
    bottom: 'bottom-0 left-0 right-0 w-full border-t slide-in-from-bottom',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Sheet Content */}
      <div
        className={cn(
          'fixed z-50 bg-white p-6 shadow-2xl transition ease-in-out animate-in duration-300 border-gray-100 flex flex-col',
          sides[side],
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
};

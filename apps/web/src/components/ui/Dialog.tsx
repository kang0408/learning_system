import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
}

export function Dialog({ isOpen, onClose, title, description, children, maxWidth = 'md', className }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Basic focus trap - focus the dialog when opened
      setTimeout(() => dialogRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        tabIndex={-1}
        className={cn(
          "bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 outline-none border border-slate-100",
          maxWidthClasses[maxWidth],
          className
        )}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div>
            <h2 id="dialog-title" className="text-lg font-bold text-gray-900">{title}</h2>
            {description && <p id="dialog-description" className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.ui.close')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  isDanger = false,
  isLoading = false,
}: Omit<DialogProps, 'children'> & {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}) {
  const { t } = useTranslation();
  
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          {cancelText || t('common.ui.cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 font-bold text-white rounded-lg transition-colors flex items-center ${
            isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
          } disabled:opacity-50`}
        >
          {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-transparent animate-spin rounded-full mr-2" />}
          {confirmText || t('common.ui.confirm')}
        </button>
      </div>
    </Dialog>
  );
}

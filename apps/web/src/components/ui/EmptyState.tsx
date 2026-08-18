import React from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn('col-span-full flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white/60 shadow-sm', className)}>
      {icon && (
        <div className="mb-4 p-4 bg-indigo-50/80 rounded-2xl text-indigo-600 border border-indigo-100/50 shadow-sm">
          {icon}
        </div>
      )}
      <h4 className="text-lg font-bold text-slate-900 mb-1">{title}</h4>
      {description && <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed font-medium">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

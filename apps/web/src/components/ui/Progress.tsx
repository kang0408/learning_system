import React from 'react';
import { cn } from '@/utils/cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'indigo';
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = 'indigo', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variants = {
      default: 'bg-slate-700',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
      indigo: 'bg-indigo-600',
    };

    return (
      <div
        ref={ref}
        className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100', className)}
        {...props}
      >
        <div
          className={cn('h-full w-full flex-1 transition-all duration-300 rounded-full', variants[variant])}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

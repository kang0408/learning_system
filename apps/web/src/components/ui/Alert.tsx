import React from 'react';
import { cn } from '@/utils/cn';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'danger';
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-50 text-slate-900 border-slate-200',
      info: 'bg-indigo-50/80 text-indigo-900 border-indigo-200',
      success: 'bg-emerald-50/80 text-emerald-900 border-emerald-200',
      warning: 'bg-amber-50/80 text-amber-900 border-amber-200',
      danger: 'bg-red-50/80 text-red-900 border-red-200',
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-xl border p-4 shadow-sm flex items-start gap-3',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('font-bold leading-none tracking-tight text-sm mb-1', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm opacity-90 leading-relaxed font-medium', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';

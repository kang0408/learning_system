import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'warning' | 'danger' | 'neutral' | 'white';
}

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'primary', ...props }, ref) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    };

    const variants = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      warning: 'text-warning',
      danger: 'text-danger',
      neutral: 'text-slate-400',
      white: 'text-white'
    };

    return (
      <Loader2
        ref={ref}
        className={cn('animate-spin', sizes[size], variants[variant], className)}
        {...props}
      />
    );
  }
);
Spinner.displayName = 'Spinner';

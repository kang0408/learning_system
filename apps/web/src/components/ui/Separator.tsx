import React from 'react';
import { cn } from '@/utils/cn';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'shrink-0 bg-slate-100',
        orientation === 'horizontal' ? 'h-[1px] w-full my-4' : 'h-full w-[1px] mx-4',
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = 'Separator';

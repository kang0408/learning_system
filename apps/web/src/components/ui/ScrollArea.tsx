import React from 'react';
import { cn } from '@/utils/cn';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: string | number;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, maxHeight, children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{ maxHeight: maxHeight || undefined, ...style }}
        className={cn('relative overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export const Breadcrumb = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav aria-label="breadcrumb" className={cn('flex items-center text-sm text-slate-500', className)} {...props} />
);

export const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentProps<'ol'>>(
  ({ className, ...props }, ref) => (
    <ol ref={ref} className={cn('flex flex-wrap items-center gap-1.5 break-words font-medium', className)} {...props} />
  )
);
BreadcrumbList.displayName = 'BreadcrumbList';

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
  )
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>(
  ({ className, ...props }, ref) => (
    <a ref={ref} className={cn('transition-colors hover:text-slate-900 font-semibold', className)} {...props} />
  )
);
BreadcrumbLink.displayName = 'BreadcrumbLink';

export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentProps<'span'>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} role="link" aria-disabled="true" aria-current="page" className={cn('font-bold text-slate-900', className)} {...props} />
  )
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

export const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
  <li role="presentation" aria-hidden="true" className={cn('text-slate-400 [&>svg]:w-3.5 [&>svg]:h-3.5', className)} {...props}>
    {children || <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TeacherSuspenseLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const TeacherPageLoading: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  className,
  size = 'lg',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-1 min-h-[calc(100vh-10rem)] w-full items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-slate-800', sizeClasses[size])} />
    </div>
  );
};

export const TeacherSuspenseLoader: React.FC<TeacherSuspenseLoaderProps> = ({
  children,
  fallback,
  className,
  size,
}) => {
  return (
    <Suspense fallback={fallback || <TeacherPageLoading className={className} size={size} />}>
      {children}
    </Suspense>
  );
};

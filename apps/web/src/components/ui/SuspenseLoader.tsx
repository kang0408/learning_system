import React, { Suspense } from 'react';
import { Spinner } from './Spinner';

interface SuspenseLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SuspenseLoader: React.FC<SuspenseLoaderProps> = ({ 
  children, 
  fallback 
}) => {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div className="flex h-64 w-full items-center justify-center">
            <Spinner className="h-10 w-10 text-indigo-600" />
            <span className="ml-4 text-xl font-bold text-indigo-600 animate-pulse">
              Đang tải dữ liệu...
            </span>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
};

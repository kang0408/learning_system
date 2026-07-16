import React, { Suspense } from 'react';
import { Spinner } from './Spinner';

import { useTranslation } from 'react-i18next';

interface SuspenseLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SuspenseLoader: React.FC<SuspenseLoaderProps> = ({ 
  children, 
  fallback 
}) => {
  const { t } = useTranslation();

  return (
    <Suspense 
      fallback={
        fallback || (
          <div className="flex h-64 w-full items-center justify-center">
            <Spinner className="h-10 w-10 text-indigo-600" />
            <span className="ml-4 text-xl font-bold text-indigo-600 animate-pulse">
              {t('common.ui.loading')}
            </span>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
};

import React, { Suspense } from 'react';
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
          <div className="flex flex-1 min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center py-12 select-none">
            <style>{`
              @keyframes jump-square {
                0%, 80%, 100% {
                  transform: translateY(0);
                }
                40% {
                  transform: translateY(-20px);
                }
              }
              .animate-jump-1 {
                animation: jump-square 1.2s infinite ease-in-out;
                animation-delay: 0s;
              }
              .animate-jump-2 {
                animation: jump-square 1.2s infinite ease-in-out;
                animation-delay: 0.2s;
              }
              .animate-jump-3 {
                animation: jump-square 1.2s infinite ease-in-out;
                animation-delay: 0.4s;
              }
            `}</style>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-indigo-600 border-2 border-zinc-900 shadow-[2px_2px_0_0_#18181b] animate-jump-1" />
              <div className="w-5 h-5 bg-amber-400 border-2 border-zinc-900 shadow-[2px_2px_0_0_#18181b] animate-jump-2" />
              <div className="w-5 h-5 bg-rose-500 border-2 border-zinc-900 shadow-[2px_2px_0_0_#18181b] animate-jump-3" />
            </div>
            <span className="mt-5 font-mono font-bold text-xs uppercase tracking-widest text-zinc-600 animate-pulse">
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

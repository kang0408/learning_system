import { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useTranslation } from 'react-i18next';

// Lazy load the feature component
const StudentSessionResultFeature = lazy(() => import('@/features/student/session-result'));

/**
 * Route Entry Component for Student Session Result
 * 
 * Follows the frontend-dev-guidelines:
 * - Uses ErrorBoundary for fault tolerance
 * - Uses SuspenseLoader for predictable loading states
 * - Lazy loads the heavy feature component
 * - Contains NO business logic or data fetching
 */
export default function SessionResultPage() {
  const { t } = useTranslation();

  return (
    <ErrorBoundary 
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-red-600 font-bold text-2xl uppercase tracking-widest text-center px-4">
          Failed to load results.
        </div>
      }
    >
      <SuspenseLoader
        fallback={
          <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center font-black text-4xl uppercase tracking-tighter animate-pulse text-indigo-600">
            {t('student.result.loading')}
          </div>
        }
      >
        <StudentSessionResultFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

import { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useTranslation } from 'react-i18next';

// Lazy load the feature component
const StudentQuizFeature = lazy(() => import('@/features/student/quiz'));

/**
 * Route Entry Component for Student Quiz
 * 
 * Follows the frontend-dev-guidelines:
 * - Uses ErrorBoundary for fault tolerance
 * - Uses SuspenseLoader for predictable loading states
 * - Lazy loads the heavy feature component
 * - Contains NO business logic or data fetching
 */
export default function QuizPage() {
  const { t } = useTranslation();
  
  return (
    <ErrorBoundary 
      fallback={<div className="h-screen bg-[#FDFBF7] flex items-center justify-center text-red-600 font-bold text-2xl uppercase tracking-widest p-8 text-center">{t('student.quiz.errorInitializing') || 'Failed to initialize quiz.'}</div>}
    >
      <SuspenseLoader
        fallback={<div className="h-screen bg-[#FDFBF7] flex items-center justify-center font-black text-4xl uppercase tracking-tighter animate-pulse text-indigo-600">{t('student.quiz.initializing') || 'Initializing...'}</div>}
      >
        <StudentQuizFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

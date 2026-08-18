import { lazy } from 'react';
import { TeacherSuspenseLoader } from '@/components/ui/TeacherSuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy load the feature component
const TeacherClassDetailFeature = lazy(() => import('@/features/teacher/class-detail'));

/**
 * Route Entry Component for Teacher Class Detail
 * 
 * Follows the frontend-dev-guidelines:
 * - Uses ErrorBoundary for fault tolerance
 * - Uses TeacherSuspenseLoader for predictable loading states
 * - Lazy loads the heavy feature component
 * - Contains NO business logic or data fetching
 */
export default function TeacherClassDetailPage() {
  return (
    <ErrorBoundary>
      <TeacherSuspenseLoader>
        <TeacherClassDetailFeature />
      </TeacherSuspenseLoader>
    </ErrorBoundary>
  );
}

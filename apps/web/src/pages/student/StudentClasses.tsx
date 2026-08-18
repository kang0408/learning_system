import { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy load the feature component
const StudentClassesFeature = lazy(() => import('@/features/student/classes'));

/**
 * Route Entry Component for Student Classes
 * 
 * Follows the frontend-dev-guidelines:
 * - Uses ErrorBoundary for fault tolerance
 * - Uses SuspenseLoader for predictable loading states
 * - Lazy loads the heavy feature component
 * - Contains NO business logic or data fetching
 */
export default function StudentClassesPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <StudentClassesFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

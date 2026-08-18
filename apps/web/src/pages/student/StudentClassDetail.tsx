import { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy load the feature component
const StudentClassDetailFeature = lazy(() => import('@/features/student/class-detail'));

/**
 * Route Entry Component for Student Class Detail
 * 
 * Follows the frontend-dev-guidelines:
 * - Uses ErrorBoundary for fault tolerance
 * - Uses SuspenseLoader for predictable loading states
 * - Lazy loads the heavy feature component
 * - Contains NO business logic or data fetching
 */
export default function StudentClassDetailPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <StudentClassDetailFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

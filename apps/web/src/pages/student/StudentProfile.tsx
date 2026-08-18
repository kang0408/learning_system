import { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy load the feature component
const StudentProfileFeature = lazy(() => import('@/features/student/profile'));

/**
 * Route Entry Component for Student Profile
 * 
 * Follows the frontend-dev-guidelines:
 * - Uses ErrorBoundary for fault tolerance
 * - Uses SuspenseLoader for predictable loading states
 * - Lazy loads the heavy feature component
 * - Contains NO business logic or data fetching
 */
export default function StudentProfilePage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <StudentProfileFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

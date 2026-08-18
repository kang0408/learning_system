import { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy load the feature component
const StudentDashboardFeature = lazy(() => import('@/features/student/dashboard'));

/**
 * Route Entry Component for Student Dashboard
 * 
 * Follows the frontend-dev-guidelines:
 * - Uses ErrorBoundary for fault tolerance
 * - Uses SuspenseLoader for predictable loading states
 * - Lazy loads the heavy feature component
 * - Contains NO business logic or data fetching
 */
export default function StudentDashboardPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <StudentDashboardFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

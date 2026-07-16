import React, { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy load the feature component
const TeacherDashboardFeature = lazy(() => import('@/features/teacher/dashboard'));

/**
 * Route Entry Component for Teacher Dashboard
 * 
 * Follows the frontend-dev-guidelines:
 * - Uses ErrorBoundary for fault tolerance
 * - Uses SuspenseLoader for predictable loading states
 * - Lazy loads the heavy feature component
 * - Contains NO business logic or data fetching
 */
export default function TeacherDashboardPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <TeacherDashboardFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

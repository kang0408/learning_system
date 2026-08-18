import { lazy } from 'react';
import { TeacherSuspenseLoader } from '@/components/ui/TeacherSuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy load the feature component
const TeacherDashboardFeature = lazy(() => import('@/features/teacher/dashboard'));

export default function TeacherDashboardPage() {
  return (
    <ErrorBoundary>
      <TeacherSuspenseLoader>
        <TeacherDashboardFeature />
      </TeacherSuspenseLoader>
    </ErrorBoundary>
  );
}

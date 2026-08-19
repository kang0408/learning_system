import { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy load the feature component
const StudentCurriculumDetailFeature = lazy(
  () => import('@/features/student/class-detail/components/StudentCurriculumDetailFeature')
);

/**
 * Route Entry Component for Student Curriculum / Lesson Detail
 */
export default function StudentCurriculumDetailPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <StudentCurriculumDetailFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

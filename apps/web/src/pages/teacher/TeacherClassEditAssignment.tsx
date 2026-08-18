import { lazy } from 'react';
import { TeacherSuspenseLoader } from '@/components/ui/TeacherSuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherClassEditAssignmentFeature = lazy(() => import('@/features/teacher/edit-assignment'));

export default function TeacherClassEditAssignmentPage() {
  return (
    <ErrorBoundary>
      <TeacherSuspenseLoader>
        <TeacherClassEditAssignmentFeature />
      </TeacherSuspenseLoader>
    </ErrorBoundary>
  );
}

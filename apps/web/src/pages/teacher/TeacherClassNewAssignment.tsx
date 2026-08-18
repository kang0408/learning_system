import { lazy } from 'react';
import { TeacherSuspenseLoader } from '@/components/ui/TeacherSuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherClassNewAssignmentFeature = lazy(() => import('@/features/teacher/new-assignment'));

export default function TeacherClassNewAssignmentPage() {
  return (
    <ErrorBoundary>
      <TeacherSuspenseLoader>
        <TeacherClassNewAssignmentFeature />
      </TeacherSuspenseLoader>
    </ErrorBoundary>
  );
}

import { lazy } from 'react';
import { TeacherSuspenseLoader } from '@/components/ui/TeacherSuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherProfileFeature = lazy(() => import('@/features/teacher/profile'));

export default function TeacherProfilePage() {
  return (
    <ErrorBoundary>
      <TeacherSuspenseLoader>
        <TeacherProfileFeature />
      </TeacherSuspenseLoader>
    </ErrorBoundary>
  );
}

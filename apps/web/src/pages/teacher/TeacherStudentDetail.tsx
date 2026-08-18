import { lazy } from 'react';
import { TeacherSuspenseLoader } from '@/components/ui/TeacherSuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherStudentDetailFeature = lazy(() => import('@/features/teacher/student-detail'));

export default function TeacherStudentDetailPage() {
  return (
    <ErrorBoundary>
      <TeacherSuspenseLoader>
        <TeacherStudentDetailFeature />
      </TeacherSuspenseLoader>
    </ErrorBoundary>
  );
}

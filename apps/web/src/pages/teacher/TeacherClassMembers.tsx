import { lazy } from 'react';
import { TeacherSuspenseLoader } from '@/components/ui/TeacherSuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherClassMembersFeature = lazy(() => import('@/features/teacher/class-members'));

export default function TeacherClassMembersPage() {
  return (
    <ErrorBoundary>
      <TeacherSuspenseLoader>
        <TeacherClassMembersFeature />
      </TeacherSuspenseLoader>
    </ErrorBoundary>
  );
}

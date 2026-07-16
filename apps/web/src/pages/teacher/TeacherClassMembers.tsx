import React, { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherClassMembersFeature = lazy(() => import('@/features/teacher/class-members'));

export default function TeacherClassMembersPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <TeacherClassMembersFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

import React, { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherClassNewAssignmentFeature = lazy(() => import('@/features/teacher/new-assignment'));

export default function TeacherClassNewAssignmentPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <TeacherClassNewAssignmentFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

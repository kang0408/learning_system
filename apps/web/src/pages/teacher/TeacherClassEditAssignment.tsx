import React, { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherClassEditAssignmentFeature = lazy(() => import('@/features/teacher/edit-assignment'));

export default function TeacherClassEditAssignmentPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <TeacherClassEditAssignmentFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

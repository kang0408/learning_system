import React, { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherProfileFeature = lazy(() => import('@/features/teacher/profile'));

export default function TeacherProfile() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <TeacherProfileFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

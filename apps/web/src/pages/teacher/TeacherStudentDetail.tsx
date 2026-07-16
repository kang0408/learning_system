import React, { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherStudentDetailFeature = lazy(() => import('@/features/teacher/student-detail'));

export default function TeacherStudentDetailPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <TeacherStudentDetailFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

import React, { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherTopicDetailFeature = lazy(() => import('@/features/teacher/topic-detail'));

export default function TeacherTopicDetailPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <TeacherTopicDetailFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

import { lazy } from 'react';
import { TeacherSuspenseLoader } from '@/components/ui/TeacherSuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherTopicDetailFeature = lazy(() => import('@/features/teacher/topic-detail'));

export default function TeacherTopicDetailPage() {
  return (
    <ErrorBoundary>
      <TeacherSuspenseLoader>
        <TeacherTopicDetailFeature />
      </TeacherSuspenseLoader>
    </ErrorBoundary>
  );
}

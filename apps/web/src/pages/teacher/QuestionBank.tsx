import { lazy } from 'react';
import { TeacherSuspenseLoader } from '@/components/ui/TeacherSuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const QuestionBankFeature = lazy(() => import('@/features/teacher/question-bank'));

export default function QuestionBankPage() {
  return (
    <ErrorBoundary>
      <TeacherSuspenseLoader>
        <QuestionBankFeature />
      </TeacherSuspenseLoader>
    </ErrorBoundary>
  );
}

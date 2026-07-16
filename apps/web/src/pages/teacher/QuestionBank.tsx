import React, { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeacherQuestionBankFeature = lazy(() => import('@/features/teacher/question-bank'));

export default function QuestionBankPage() {
  return (
    <ErrorBoundary>
      <SuspenseLoader>
        <TeacherQuestionBankFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

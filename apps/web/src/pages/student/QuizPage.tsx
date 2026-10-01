import { lazy } from 'react';
import { SuspenseLoader } from '@/components/ui/SuspenseLoader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useTranslation } from 'react-i18next';

import { AlertTriangle } from 'lucide-react';

// Lazy load the feature component
const StudentQuizFeature = lazy(() => import('@/features/student/quiz'));

/**
 * Route Entry Component for Student Quiz
 * 
 * Follows the frontend-dev-guidelines:
 * - Uses ErrorBoundary for fault tolerance
 * - Uses SuspenseLoader for predictable loading states
 * - Lazy loads the heavy feature component
 * - Contains NO business logic or data fetching
 */
export default function QuizPage() {
  const { t } = useTranslation();
  
  return (
    <ErrorBoundary 
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-lg w-full border-4 border-zinc-900 bg-white p-8 sm:p-10 shadow-[8px_8px_0_0_#18181b] space-y-6">
            <div className="inline-flex p-3 bg-red-50 text-red-600 border-2 border-zinc-900">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900">
                {t('student.quiz.errorInitializing') || 'Lỗi khi khởi tạo bài kiểm tra'}
              </h2>
              <p className="text-sm sm:text-base font-medium text-zinc-600 max-w-md mx-auto">
                {t('student.quiz.errorInitializingDesc', 'Không thể khởi tạo phiên làm bài. Bài tập có thể đã đủ số lần làm hoặc không khả dụng.')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="/quiz"
                className="flex-1 font-black text-xs uppercase tracking-wider bg-indigo-600 text-white border-2 border-zinc-900 px-5 py-3.5 hover:bg-zinc-900 transition-colors shadow-[2px_2px_0_0_#18181b] text-center whitespace-nowrap"
              >
                {t('student.quiz.backToPractice', 'TRUNG TÂM LUYỆN TẬP')}
              </a>
              <a
                href="/student"
                className="flex-1 font-black text-xs uppercase tracking-wider bg-white text-zinc-900 border-2 border-zinc-900 px-5 py-3.5 hover:bg-zinc-100 transition-colors text-center whitespace-nowrap"
              >
                {t('student.dashboard.backToDashboard', 'TRANG CHỦ')}
              </a>
            </div>
          </div>
        </div>
      }
    >
      <SuspenseLoader
        fallback={<div className="h-screen bg-[#FDFBF7] flex items-center justify-center font-black text-4xl uppercase tracking-tighter animate-pulse text-indigo-600">{t('student.quiz.initializing') || 'Initializing...'}</div>}
      >
        <StudentQuizFeature />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

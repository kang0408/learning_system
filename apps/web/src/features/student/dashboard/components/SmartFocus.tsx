import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import type { DashboardSummary } from '../types';

interface SmartFocusProps {
  summary?: DashboardSummary;
}

export const SmartFocus: React.FC<SmartFocusProps> = ({ summary }) => {
  const { t } = useTranslation();

  if (!summary) return null;

  const { urgent_count, due_today_count, priority_assignments, top_weak_topics } = summary;
  const topAssignment = priority_assignments && priority_assignments.length > 0 ? priority_assignments[0] : null;
  const topWeak = top_weak_topics && top_weak_topics.length > 0 ? top_weak_topics[0] : null;

  const hasUrgentActions = due_today_count > 0 || urgent_count > 0 || topAssignment !== null;

  return (
    <section className="border-2 border-zinc-900 bg-zinc-50 p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-900 pb-4">
        <div>
          <span className="font-bold text-xs uppercase tracking-widest bg-zinc-900 text-white px-2 py-1">
            {t('student.dashboard.smartFocus', 'PRIORITY ACTION')}
          </span>
          <h3 className="text-3xl font-black tracking-tighter uppercase mt-2">
            {t('student.dashboard.todayFocus', "TODAY'S CRITICAL FOCUS")}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {urgent_count > 0 && (
            <span className="font-bold text-xs uppercase tracking-widest bg-red-600 text-white px-3 py-1.5 border-2 border-zinc-900">
              {urgent_count} {t('student.dashboard.urgentBadge', 'URGENT')}
            </span>
          )}
          {due_today_count > 0 && (
            <span className="font-bold text-xs uppercase tracking-widest bg-indigo-600 text-white px-3 py-1.5 border-2 border-zinc-900">
              {due_today_count} {t('student.dashboard.sm2DueBadge', 'DUE TODAY')}
            </span>
          )}
        </div>
      </div>

      {!hasUrgentActions ? (
        <div className="p-8 border-2 border-dashed border-zinc-300 text-center font-bold text-zinc-400 uppercase tracking-widest text-lg">
          {t('student.dashboard.allCaughtUp', 'ALL CAUGHT UP - NO PENDING URGENT TASKS')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Spaced Repetition Daily Review */}
          <div className={`border-2 border-zinc-900 p-6 flex flex-col justify-between transition-transform ${
            due_today_count > 0 
              ? 'bg-indigo-600 text-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#18181b]' 
              : 'bg-white text-zinc-900 opacity-60'
          }`}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`font-bold text-xs uppercase tracking-widest px-2 py-0.5 border ${
                  due_today_count > 0 ? 'bg-indigo-700 text-white border-white' : 'bg-zinc-100 text-zinc-700 border-zinc-900'
                }`}>
                  {t('student.dashboard.spacedRepetition', 'SPACED REPETITION')}
                </span>
                <span className="font-black text-2xl tracking-tighter">{due_today_count}</span>
              </div>
              <h4 className="text-2xl font-black tracking-tighter uppercase leading-tight mb-2">
                {t('student.dashboard.dailyReviewBatch', 'DAILY MEMORY DRILL')}
              </h4>
              <p className={`text-sm font-medium ${due_today_count > 0 ? 'text-indigo-100' : 'text-zinc-500'}`}>
                {due_today_count > 0 
                  ? t('student.dashboard.dueReviewDesc', { count: due_today_count, defaultValue: `${due_today_count} questions scheduled for retention today` })
                  : t('student.dashboard.noReviewDesc', 'No questions due for memory review today.')}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-current">
              {due_today_count > 0 ? (
                <Link
                  to="/quiz"
                  className="flex items-center justify-between font-bold uppercase tracking-widest text-sm bg-white text-indigo-900 border-2 border-zinc-900 px-4 py-2 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <span>{t('student.dashboard.startReviewNow', 'START REVIEW')}</span>
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">
                  {t('student.dashboard.completedToday', 'UP TO DATE')}
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Highest Priority Assignment */}
          <div className={`border-2 border-zinc-900 p-6 flex flex-col justify-between transition-transform ${
            topAssignment?.is_overdue 
              ? 'bg-red-50 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#dc2626]' 
              : 'bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5]'
          }`}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`font-bold text-xs uppercase tracking-widest px-2 py-0.5 border-2 border-zinc-900 ${
                  topAssignment?.is_overdue ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'
                }`}>
                  {topAssignment?.is_overdue 
                    ? t('student.dashboard.overdueTag', 'OVERDUE') 
                    : topAssignment?.is_due_soon 
                    ? t('student.dashboard.dueSoonTag', 'DUE SOON') 
                    : t('student.dashboard.priorityAssignment', 'ASSIGNMENT')}
                </span>
                {topAssignment?.class?.name && (
                  <span className="font-bold text-xs uppercase text-zinc-500 truncate max-w-[120px]">
                    {topAssignment.class.name}
                  </span>
                )}
              </div>

              <h4 className="text-xl font-black tracking-tighter uppercase line-clamp-2 mb-2">
                {topAssignment?.title || t('student.dashboard.noAssignment', 'NO PENDING HOMEWORK')}
              </h4>

              {topAssignment?.deadline && (
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {t('student.dashboard.deadline')}: {new Date(topAssignment.deadline).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t-2 border-zinc-900">
              {topAssignment ? (
                <Link
                  to={`/quiz?assignment=${topAssignment.id}`}
                  className="flex items-center justify-between font-bold uppercase tracking-widest text-sm bg-zinc-900 text-white px-4 py-2 hover:bg-indigo-600 hover:border-indigo-600 transition-colors"
                >
                  <span>
                    {(topAssignment.attempts_count || 0) > 0 
                      ? t('student.dashboard.retry') 
                      : t('student.dashboard.start')}
                  </span>
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">
                  {t('student.dashboard.noPending', 'CLEARED')}
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Weak Topic Recovery */}
          <div className="border-2 border-zinc-900 p-6 flex flex-col justify-between bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#d97706] transition-transform">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold text-xs uppercase tracking-widest px-2 py-0.5 bg-amber-500 text-white border-2 border-zinc-900">
                  {t('student.dashboard.weakSpotTag', 'WEAK SPOT')}
                </span>
                {topWeak && (
                  <span className="font-bold text-xs uppercase tracking-widest text-red-600">
                    {topWeak.weak_questions} {t('student.dashboard.hardQs', 'HARD')}
                  </span>
                )}
              </div>

              <h4 className="text-xl font-black tracking-tighter uppercase line-clamp-2 mb-2">
                {topWeak?.topic || t('student.dashboard.allTopicsSolid', 'TOPICS BALANCED')}
              </h4>

              <p className="text-xs font-medium text-zinc-500">
                {topWeak 
                  ? t('student.dashboard.weakTopicRecoveryDesc', 'Practice questions in this topic to boost retention score.')
                  : t('student.dashboard.noWeakTopicsDesc', 'No critical weak topics detected. Great job!')}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-zinc-900">
              {topWeak ? (
                <Link
                  to="/quiz"
                  className="flex items-center justify-between font-bold uppercase tracking-widest text-sm border-2 border-zinc-900 text-zinc-900 px-4 py-2 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-colors"
                >
                  <span>{t('student.dashboard.practiceTopic', 'PRACTICE')}</span>
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">
                  {t('student.dashboard.mastered', 'STABLE')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

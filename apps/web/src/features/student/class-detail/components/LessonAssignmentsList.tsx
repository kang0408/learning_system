import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CurriculumAssignmentItem } from '../types/curriculum.types';
import type { AssignmentItem } from '../types';

interface LessonAssignmentsListProps {
  curriculumAssignments?: CurriculumAssignmentItem[];
  allClassAssignments: AssignmentItem[];
}

export const LessonAssignmentsList: React.FC<LessonAssignmentsListProps> = ({
  curriculumAssignments,
  allClassAssignments
}) => {
  const { t, i18n } = useTranslation();

  if (!curriculumAssignments || curriculumAssignments.length === 0) return null;

  // Build a lookup map of student's assignment session data by assignment id
  const assignmentMap = new Map<string, AssignmentItem>();
  allClassAssignments.forEach(a => assignmentMap.set(a.id, a));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-widest text-zinc-500">
        <span>{t('student.classDetail.assignmentsSection', { count: curriculumAssignments.length })}</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {curriculumAssignments.map(item => {
          const rawAssign = item.assignment;
          if (!rawAssign) return null;

          const detailedAssign = assignmentMap.get(rawAssign.id);
          const sessions = detailedAssign?.quiz_sessions || [];
          const completedSessions = sessions.filter(s => s.status === 'completed');
          const bestScore = completedSessions.length > 0
            ? Math.max(...completedSessions.map(s => s.score))
            : null;
          const attemptsCount = completedSessions.length;
          const maxAttempts = rawAssign.max_attempts || detailedAssign?.max_attempts || 0;
          const isLocked = maxAttempts > 0 && attemptsCount >= maxAttempts;
          const isOverdue = rawAssign.deadline ? new Date(rawAssign.deadline) < new Date() : false;

          const getModeLabel = (mode: string) => {
            switch (mode) {
              case 'adaptive':
                return t('student.classDetail.adaptiveMode');
              case 'exam':
                return t('student.classDetail.examMode');
              case 'standard':
              default:
                return t('student.classDetail.standardMode');
            }
          };

          return (
            <div
              key={item.id || item.assignment_id}
              className={`border-2 border-zinc-900 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                isLocked
                  ? 'bg-zinc-100 opacity-70'
                  : 'bg-white shadow-[3px_3px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-black uppercase tracking-tight text-zinc-900 truncate">
                    {rawAssign.title}
                  </h4>
                  <span className="font-mono font-bold text-[10px] uppercase px-2 py-0.5 border border-zinc-900 bg-indigo-50 text-indigo-900">
                    {getModeLabel(rawAssign.mode)}
                  </span>
                  {isOverdue && (
                    <span className="font-mono font-bold text-[10px] uppercase px-2 py-0.5 bg-red-600 text-white">
                      {t('student.classDetail.overdue')}
                    </span>
                  )}
                </div>

                {rawAssign.description && (
                  <p className="text-xs text-zinc-600 line-clamp-1 font-medium">
                    {rawAssign.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-500 font-bold">
                  {rawAssign.deadline && (
                    <span>
                      {t('student.classDetail.deadlineLabel', {
                        date: new Date(rawAssign.deadline).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')
                      })}
                    </span>
                  )}
                  {rawAssign.time_limit && (
                    <span>{t('student.classDetail.timeLimitLabel', { minutes: rawAssign.time_limit })}</span>
                  )}
                  {maxAttempts > 0 && (
                    <span>
                      {t('student.classDetail.attemptsLabel', { count: attemptsCount, max: maxAttempts })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-200">
                {bestScore !== null && (
                  <div className="text-right mr-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {t('student.classDetail.bestScore')}
                    </p>
                    <Link
                      to={`/session-result?id=${completedSessions[0].id}`}
                      className="text-2xl font-black text-indigo-600 hover:underline"
                    >
                      {bestScore.toFixed(0)}
                    </Link>
                  </div>
                )}

                {isLocked ? (
                  <span className="font-bold border-2 border-zinc-900 px-4 py-2.5 text-xs uppercase tracking-widest bg-zinc-200">
                    {t('student.classDetail.quizCompleted')}
                  </span>
                ) : (
                  <Link
                    to={`/quiz?assignment=${rawAssign.id}`}
                    className="font-bold bg-indigo-600 text-white border-2 border-zinc-900 px-5 py-2.5 text-xs text-center hover:bg-zinc-900 transition-colors uppercase tracking-widest shadow-[2px_2px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    {bestScore !== null ? t('student.classDetail.retakeQuiz') : t('student.classDetail.startQuiz')}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Assignment, DailyScheduleClass } from '../types';

interface ActionItemsProps {
  assignments: Assignment[];
  dailySchedule: DailyScheduleClass[];
}

export const ActionItems: React.FC<ActionItemsProps> = ({ assignments, dailySchedule }) => {
  const { t } = useTranslation();

  const pendingAssignments = useMemo(() => {
    return assignments.filter(a => {
      for (const cls of dailySchedule) {
        if (cls.assignments.some(ass => ass.assignment_id === a.id)) return false;
      }
      return true;
    });
  }, [assignments, dailySchedule]);

  return (
    <section className="lg:col-span-7 space-y-12">
      <div className="flex justify-between items-end border-b-2 border-zinc-900 pb-2">
        <h2 className="text-3xl font-black tracking-tighter uppercase">{t('student.dashboard.actionItems')}</h2>
        <Link to="/student/classes" className="font-bold text-sm uppercase tracking-widest text-indigo-600 hover:underline flex items-center">
          {t('student.dashboard.allClasses')} <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="space-y-6">
        {/* Daily Schedule (SM-2) */}
        {dailySchedule.map((cls, idx) => (
          <div key={`sm2-${idx}`} className="border-2 border-zinc-900 p-6 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-colors group">
            <div className="flex justify-between items-start mb-6">
              <h4 className="text-2xl font-black tracking-tighter uppercase">{cls.class_name}</h4>
              <span className="font-bold text-lg border-2 border-current px-3 py-1">{cls.total_due} {t('student.dashboard.dueLabel')}</span>
            </div>
            <div className="space-y-4">
              {cls.assignments.map((ass) => (
                <Link
                  key={ass.assignment_id}
                  to={ass.assignment_id !== 'general' ? `/quiz?assignment=${ass.assignment_id}` : '#'}
                  className="flex justify-between items-center group/item border-t border-current pt-4 font-medium text-lg hover:italic"
                >
                  <span>{ass.title}</span>
                  <ArrowUpRight className="w-6 h-6 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Assignments */}
        {pendingAssignments.length === 0 && dailySchedule.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-zinc-300 text-center font-bold text-zinc-400 uppercase tracking-widest text-xl">
            {t('student.dashboard.noPendingTasks')}
          </div>
        ) : (
          pendingAssignments.map(assignment => {
            const isOverdue = assignment.deadline ? new Date(assignment.deadline) < new Date() : false;
            const completedSessions = assignment.quiz_sessions?.filter(s => s.status === 'completed') || [];
            const attemptsCount = completedSessions.length;
            const maxAttempts = assignment.max_attempts || 0;
            const isLocked = maxAttempts > 0 && attemptsCount >= maxAttempts;

            return (
              <div key={`ass-${assignment.id}`} className={`border-2 border-zinc-900 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all ${isLocked ? 'opacity-50 bg-zinc-100' : 'hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] hover:border-indigo-600 bg-white'}`}>
                <div>
                  <h4 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                    {assignment.title}
                    {isOverdue && <span className="bg-red-600 text-white text-xs px-2 py-1 tracking-widest">{t('student.dashboard.overdue')}</span>}
                  </h4>
                  <p className="font-medium text-zinc-500 mt-2">
                    {assignment.deadline ? `${t('student.dashboard.deadline')}: ${new Date(assignment.deadline).toLocaleDateString()}` : t('student.dashboard.noDeadline')}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {isLocked ? (
                    <span className="font-bold border-2 border-zinc-900 px-4 py-2 w-full md:w-auto text-center">{t('student.dashboard.submitted')}</span>
                  ) : (
                    <Link
                      to={`/quiz?assignment=${assignment.id}`}
                      className="font-bold bg-zinc-900 text-white border-2 border-zinc-900 px-6 py-2 w-full md:w-auto text-center hover:bg-indigo-600 hover:border-indigo-600 transition-colors uppercase tracking-widest"
                    >
                      {attemptsCount > 0 ? t('student.dashboard.retry') : t('student.dashboard.start')}
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

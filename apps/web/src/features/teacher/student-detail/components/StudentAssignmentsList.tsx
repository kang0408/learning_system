import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, CheckCircle, Clock, Target, CalendarDays } from 'lucide-react';
import type { StudentAssignment } from '../types';

interface StudentAssignmentsListProps {
  assignments: StudentAssignment[];
}

export const StudentAssignmentsList: React.FC<StudentAssignmentsListProps> = ({ assignments }) => {
  const { t } = useTranslation();
  const publishedAssignments = assignments.filter(a => a.is_published);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-500" /> {t('teacher.studentDetail.assignments.title')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t('teacher.studentDetail.assignments.total', { count: publishedAssignments.length })}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[600px] lg:max-h-[calc(100vh-200px)]">
        <ul className="divide-y divide-gray-100">
          {publishedAssignments.map(a => {
            const isOverdue = a.student_status === 'pending' && a.deadline && new Date(a.deadline) < new Date();
            
            return (
              <li key={a.id} className="p-5 hover:bg-gray-50/80 transition-colors duration-200">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-semibold text-gray-900 text-base">{a.title}</p>
                    {a.student_status === 'completed' ? (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-semibold shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5" /> {t('teacher.studentDetail.assignments.statusCompleted', { score: a.student_score })}
                      </span>
                    ) : a.student_status === 'in_progress' ? (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold shadow-sm">
                        <Clock className="w-3.5 h-3.5" /> {t('teacher.studentDetail.assignments.statusInProgress')}
                      </span>
                    ) : isOverdue ? (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-semibold shadow-sm">
                        <Target className="w-3.5 h-3.5" /> {t('teacher.studentDetail.assignments.statusOverdue')}
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-md text-xs font-semibold shadow-sm">
                        <BookOpen className="w-3.5 h-3.5" /> {t('teacher.studentDetail.assignments.statusPending')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5 mt-1">
                    <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-50/80 px-2.5 py-1.5 rounded-md border border-gray-200">
                      <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      {t('teacher.studentDetail.assignments.deadlinePrefix')}{a.deadline ? new Date(a.deadline).toLocaleDateString() : t('teacher.studentDetail.assignments.noDeadline')}
                    </div>
                    <div className="flex items-center text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-md border border-indigo-100">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      {a.is_all_students ? t('teacher.studentDetail.assignments.assignedAll') : t('teacher.studentDetail.assignments.assignedSpecific')}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
          {publishedAssignments.length === 0 && (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <BookOpen className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-900 font-medium text-lg">{t('teacher.studentDetail.assignments.noAssignments')}</p>
              <p className="text-gray-500 text-sm mt-1">{t('teacher.studentDetail.assignments.noAssignmentsDesc')}</p>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AssignmentItem } from '../types';

interface ClassAssignmentsProps {
  assignments: AssignmentItem[];
}

export const ClassAssignments: React.FC<ClassAssignmentsProps> = ({ assignments }) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-black tracking-tighter uppercase mb-8">
        {t('student.classDetail.assignments', { count: assignments.length })}
      </h2>
      
      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {assignments.map(assignment => {
            const isOverdue = assignment.deadline ? new Date(assignment.deadline) < new Date() : false;
            const sessions = assignment.quiz_sessions || [];
            const completedSessions = sessions.filter(s => s.status === 'completed');
            const bestScore = completedSessions.length > 0 
              ? Math.max(...completedSessions.map(s => s.score)) 
              : null;
            const attemptsCount = completedSessions.length;
            const maxAttempts = assignment.max_attempts || 0;
            const isLocked = maxAttempts > 0 && attemptsCount >= maxAttempts;
            
            return (
              <div 
                key={assignment.id} 
                className={`border-2 border-zinc-900 p-6 md:p-8 flex flex-col lg:flex-row justify-between gap-8 transition-all ${
                  isLocked 
                    ? 'bg-zinc-100 opacity-60' 
                    : 'hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#4f46e5] hover:border-indigo-600 bg-white group'
                }`}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <h4 className="text-3xl font-black tracking-tighter uppercase group-hover:text-indigo-600 transition-colors">
                      {assignment.title}
                    </h4>
                    {isOverdue && (
                      <span className="bg-red-600 text-white font-bold uppercase tracking-widest text-xs px-2 py-1">
                        {t('student.classDetail.overdue')}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-medium text-zinc-600 mb-6">
                    {assignment.description || t('student.classDetail.noDescription')}
                  </p>
                  <div className="font-mono font-bold text-sm bg-indigo-50 text-indigo-900 inline-block px-3 py-1 border border-indigo-200">
                    {assignment.deadline 
                      ? t('student.classDetail.due', { 
                          date: new Date(assignment.deadline).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US') 
                        }) 
                      : t('student.classDetail.noDeadline')}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end mr-4">
                    {bestScore !== null && (
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
                          {t('student.classDetail.bestScore')}
                        </p>
                        <Link 
                          to={`/session-result?id=${completedSessions[0].id}`} 
                          className="text-4xl font-black hover:underline text-indigo-600"
                        >
                          {bestScore.toFixed(0)}
                        </Link>
                      </div>
                    )}
                    {maxAttempts > 0 && (
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">
                        {t('student.classDetail.attempts', { count: attemptsCount, max: maxAttempts })}
                      </p>
                    )}
                  </div>

                  {isLocked ? (
                    <span className="font-bold border-2 border-zinc-900 px-6 py-4 uppercase tracking-widest text-center">
                      {t('student.classDetail.completed')}
                    </span>
                  ) : (
                    <Link 
                      to={`/quiz?assignment=${assignment.id}`} 
                      className="font-bold bg-indigo-600 text-white border-2 border-indigo-600 px-8 py-4 text-center hover:bg-zinc-900 hover:border-zinc-900 transition-colors uppercase tracking-widest"
                    >
                      {bestScore !== null ? t('student.classDetail.retry') : t('student.classDetail.begin')}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 border-2 border-dashed border-zinc-400 text-center">
          <p className="text-3xl font-black uppercase tracking-tighter text-zinc-400">
            {t('student.classDetail.noAssignments')}
          </p>
        </div>
      )}
    </div>
  );
};

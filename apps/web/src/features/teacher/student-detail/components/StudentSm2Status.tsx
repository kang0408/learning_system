import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, CheckCircle, BookOpen, Target } from 'lucide-react';
import type { StudentStats } from '../types';

interface StudentSm2StatusProps {
  sm2Summary: StudentStats['sm2_summary'];
}

export const StudentSm2Status: React.FC<StudentSm2StatusProps> = ({ sm2Summary }) => {
  const { t } = useTranslation();
  if (!sm2Summary) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-indigo-600" /> {t('teacher.studentDetail.sm2.title')}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">
            {t('teacher.studentDetail.sm2.description', { count: sm2Summary.total_questions })}
          </p>
        </div>
        <div className="text-left md:text-right bg-red-50 p-4 rounded-xl border border-red-100">
          <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">{t('teacher.studentDetail.sm2.dueToday')}</div>
          <div className="text-2xl font-extrabold text-red-700">{sm2Summary.due_today} {t('teacher.studentDetail.sm2.dueTodayUnit')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Mastered */}
        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
          <div className="text-emerald-700 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4" /> {t('teacher.studentDetail.sm2.mastered')}
          </div>
          <div className="text-4xl font-extrabold text-emerald-600 mb-1">
            {Math.round(sm2Summary.mastered.pct)}%
          </div>
          <div className="text-sm text-emerald-700/80 font-medium">
            {sm2Summary.mastered.count} {t('teacher.studentDetail.sm2.masteredUnit')}
          </div>
        </div>

        {/* Learning */}
        <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
          <div className="text-blue-700 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4" /> {t('teacher.studentDetail.sm2.learning')}
          </div>
          <div className="text-4xl font-extrabold text-blue-600 mb-1">
            {Math.round(sm2Summary.learning.pct)}%
          </div>
          <div className="text-sm text-blue-700/80 font-medium flex justify-between">
            <span>{t('teacher.studentDetail.sm2.learningTotal', { count: sm2Summary.learning.count })}</span>
            <span className="text-red-500 font-bold" title={t('teacher.studentDetail.sm2.learningRiskTooltip')}>{t('teacher.studentDetail.sm2.learningRisk', { count: sm2Summary.learning.at_risk })}</span>
          </div>
        </div>

        {/* New */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-slate-700 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
            <Target className="w-4 h-4" /> {t('teacher.studentDetail.sm2.new')}
          </div>
          <div className="text-4xl font-extrabold text-slate-700 mb-1">
            {Math.round(sm2Summary.new.pct)}%
          </div>
          <div className="text-sm text-slate-500 font-medium">
            {sm2Summary.new.count} {t('teacher.studentDetail.sm2.newUnit')}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-8 w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
        <div className="h-full bg-emerald-500 hover:brightness-110 transition-all" style={{ width: `${sm2Summary.mastered.pct}%` }} title={t('teacher.studentDetail.sm2.masteredTooltip', { pct: Math.round(sm2Summary.mastered.pct) })}></div>
        <div className="h-full bg-blue-500 hover:brightness-110 transition-all" style={{ width: `${sm2Summary.learning.pct}%` }} title={t('teacher.studentDetail.sm2.learningTooltip', { pct: Math.round(sm2Summary.learning.pct) })}></div>
        <div className="h-full bg-slate-300 hover:brightness-95 transition-all" style={{ width: `${sm2Summary.new.pct}%` }} title={t('teacher.studentDetail.sm2.newTooltip', { pct: Math.round(sm2Summary.new.pct) })}></div>
      </div>
    </div>
  );
};


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EditAssignmentHeaderProps {
  classId: string;
}

export const EditAssignmentHeader: React.FC<EditAssignmentHeaderProps> = ({ classId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
      <div className="flex items-center mb-2 md:mb-0">
        <button 
          onClick={() => navigate(`/teacher/classes/${classId}?tab=assignments`)} 
          className="mr-4 p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/60 transition-all shadow-xs"
          aria-label={t('teacher.classDetail.back', 'Quay lại')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{t('teacher.editAssignment.title')}</h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
              {t('teacher.editAssignment.badgeUpdate')}
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">{t('teacher.editAssignment.subtitle')}</p>
        </div>
      </div>
    </div>
  );
};

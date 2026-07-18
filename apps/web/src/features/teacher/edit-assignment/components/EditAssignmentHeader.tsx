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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition duration-300">
      <div className="flex items-center mb-4 md:mb-0">
        <button 
          onClick={() => navigate(`/teacher/classes/${classId}?tab=assignments`)} 
          className="mr-5 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('teacher.editAssignment.title')}</h1>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
              {t('teacher.editAssignment.badgeUpdate')}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{t('teacher.editAssignment.subtitle')}</p>
        </div>
      </div>
    </div>
  );
};

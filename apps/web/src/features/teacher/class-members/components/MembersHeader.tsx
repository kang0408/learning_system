import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MembersHeaderProps {
  classId: string;
}

export const MembersHeader: React.FC<MembersHeaderProps> = ({ classId }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center pb-6 border-b border-slate-100 gap-4">
      <Link 
        to={`/teacher/classes/${classId}?tab=students`} 
        className="p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/60 transition-all shadow-xs"
        aria-label={t('teacher.classDetail.back', 'Quay lại')}
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
        <Users className="w-6 h-6 text-indigo-600" />
        {t('teacher.classMembers.title')}
      </h1>
    </div>
  );
};

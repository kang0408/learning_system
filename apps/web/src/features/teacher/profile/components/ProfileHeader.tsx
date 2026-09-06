import React from 'react';
import { Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ProfileHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{t('teacher.profile.title')}</h1>
          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> {t('teacher.profile.badgeTeacher')}
          </span>
        </div>
        <p className="text-sm text-slate-500 font-medium mt-0.5">{t('teacher.profile.subtitle')}</p>
      </div>
    </div>
  );
};

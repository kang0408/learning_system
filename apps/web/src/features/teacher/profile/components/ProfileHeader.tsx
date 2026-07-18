import React from 'react';
import { Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ProfileHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition duration-300">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('teacher.profile.title')}</h1>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> {t('teacher.profile.badgeTeacher')}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{t('teacher.profile.subtitle')}</p>
      </div>
    </div>
  );
};

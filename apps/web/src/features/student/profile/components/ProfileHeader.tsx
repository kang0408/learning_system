import React from 'react';
import { useTranslation } from 'react-i18next';

export const ProfileHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 border-b-4 border-zinc-900 pb-8">
      <h1 className="text-6xl sm:text-7xl font-black tracking-tighter uppercase text-zinc-900">
        {t('student.profile.title')}
      </h1>
      <p className="text-xl font-bold tracking-tight text-zinc-500 uppercase">
        {t('student.profile.subtitle')}
      </p>
    </div>
  );
};

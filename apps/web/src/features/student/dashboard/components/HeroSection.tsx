import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalyticsData } from '../types';

interface HeroSectionProps {
  analytics: AnalyticsData;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ analytics }) => {
  const { t } = useTranslation();

  const dueToday = useMemo(() => {
    return analytics?.sm2_summary?.due_today ?? analytics?.questions_due_today ?? 0;
  }, [analytics]);

  return (
    <section className="border-b-4 border-zinc-900 pb-12">
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
        {t('student.dashboard.today')} <br /> 
        <span className="text-indigo-600">{t('student.dashboard.agenda')}</span>
      </h1>
      <div className="text-2xl md:text-4xl font-medium tracking-tight max-w-3xl">
        {dueToday > 0 ? (
          <p>
            {t('student.dashboard.pendingReviews1')}
            <span className="font-black bg-indigo-600 text-white px-2 py-1 mx-2">
              {t('student.dashboard.pendingReviews2', { count: dueToday })}
            </span>
            {t('student.dashboard.pendingReviews3')}
          </p>
        ) : (
          <p>
            {t('student.dashboard.allClear1')}
            <span className="text-zinc-500 ml-2">{t('student.dashboard.allClear2')}</span>
          </p>
        )}
      </div>
    </section>
  );
};

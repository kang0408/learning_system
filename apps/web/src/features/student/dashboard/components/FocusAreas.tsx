import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WeakTopic } from '../types';

interface FocusAreasProps {
  weakTopics: WeakTopic[];
}

export const FocusAreas: React.FC<FocusAreasProps> = ({ weakTopics }) => {
  const { t } = useTranslation();

  if (!weakTopics || weakTopics.length === 0) return null;

  return (
    <div>
      <h3 className="text-2xl font-black tracking-tighter uppercase mb-6 border-b-2 border-zinc-900 pb-2">
        {t('student.dashboard.focusAreas')}
      </h3>
      <div className="space-y-4">
        {weakTopics.slice(0, 5).map((topic, i) => (
          <div key={i} className="flex flex-col border-2 border-zinc-900 p-4 bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] transition-transform">
            <div className="flex justify-between items-start border-b-2 border-zinc-200 pb-2 mb-2">
              <span className="font-black text-xl tracking-tighter uppercase">{topic.topic}</span>
              <span className={`font-bold px-2 py-1 text-xs tracking-widest uppercase text-white ${
                topic.trend === 'improving' ? 'bg-indigo-600' : 
                topic.trend === 'declining' ? 'bg-red-600' : 'bg-zinc-500'
              }`}>
                {topic.trend === 'improving' ? t('student.dashboard.improving') : 
                 topic.trend === 'declining' ? t('student.dashboard.declining') : 
                 t('student.dashboard.stable')}
              </span>
            </div>
            <div className="flex justify-between items-end text-sm font-bold uppercase tracking-widest">
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                <span className="text-red-600">{topic.weak_questions} {t('student.dashboard.hardQs')}</span>
                <span className="text-amber-600">{topic.overdue_questions} {t('student.dashboard.overdue')}</span>
              </div>
              <div className="text-right">
                <span className="block text-zinc-500 text-[10px]">{t('student.dashboard.memoryScore')}</span>
                <span className="text-lg font-black">{topic.avg_ef}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Target, CheckCircle } from 'lucide-react';
import type { StudentStats } from '../types';

interface StudentWeakTopicsProps {
  weakTopics?: StudentStats['weak_topics'];
}

const getTopicPerformanceStyle = (pct: number) => {
  if (pct >= 85) {
    return {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      bar: 'bg-emerald-500 hover:bg-emerald-600',
      hover: 'group-hover:text-emerald-700',
    };
  }
  if (pct >= 70) {
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'bg-amber-500 hover:bg-amber-600',
      hover: 'group-hover:text-amber-700',
    };
  }
  return {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    bar: 'bg-rose-500 hover:bg-rose-600',
    hover: 'group-hover:text-rose-700',
  };
};

export const StudentWeakTopics: React.FC<StudentWeakTopicsProps> = ({ weakTopics }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
          <Target className="w-5 h-5 text-rose-500" /> {t('teacher.studentDetail.weakTopics.title')}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{t('teacher.studentDetail.weakTopics.description')}</p>
      </div>
      <div className="p-5 md:p-6 bg-white">
        {weakTopics && weakTopics.length > 0 ? (
          <div className="space-y-5">
            {weakTopics.map((t, idx) => {
              const style = getTopicPerformanceStyle(t.accuracy_pct || 0);
              const weakQs = (t as any).weak_questions || 0;
              return (
                <div key={idx} className="group">
                  <div className="flex justify-between items-center text-sm font-medium mb-2 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-gray-900 ${style.hover} transition-colors font-semibold truncate`}>
                        {t.topic}
                      </span>
                      {weakQs > 0 && (
                        <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-150 px-1.5 py-0.2 rounded flex-shrink-0">
                          {weakQs} câu hay sai
                        </span>
                      )}
                    </div>
                    <span className={`${style.text} ${style.bg} px-2.5 py-0.5 rounded border ${style.border} font-bold text-xs flex-shrink-0`}>
                      {t.accuracy_pct?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                      className={`${style.bar} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(5, t.accuracy_pct || 0))}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-900 font-semibold text-lg">{t('teacher.studentDetail.weakTopics.noWeakTopics')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('teacher.studentDetail.weakTopics.noWeakTopicsDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

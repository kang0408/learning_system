import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WeakTopic, HierarchicalTopicNode } from '../types';
import { StudentRadarChart } from './StudentRadarChart';

interface FocusAreasProps {
  weakTopics: WeakTopic[];
  topicsTree?: HierarchicalTopicNode[];
  selectedTopic?: string | null;
  onSelectTopic?: (topic: string | null) => void;
}

export const FocusAreas: React.FC<FocusAreasProps> = ({ 
  weakTopics, 
  topicsTree = [],
  selectedTopic,
  onSelectTopic 
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'matrix' | 'radar'>('matrix');

  if ((!weakTopics || weakTopics.length === 0) && (!topicsTree || topicsTree.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with separate title and tabs rows */}
      <div className="border-b-2 border-zinc-900 pb-3 space-y-3">
        <div>
          <span className="font-bold text-xs uppercase tracking-widest text-zinc-500 block">
            {t('student.dashboard.knowledgeMastery', 'ĐÁNH GIÁ NĂNG LỰC')}
          </span>
          <h3 className="text-2xl font-black tracking-tighter uppercase text-zinc-900">
            {t('student.dashboard.focusAreas', 'CHỦ ĐỀ CẦN CẢI THIỆN')}
          </h3>
        </div>

        {(topicsTree.length > 0 || weakTopics.length > 0) && (
          <div className="flex border-2 border-zinc-900 bg-white w-full">
            <button
              onClick={() => setViewMode('matrix')}
              className={`w-1/2 flex-1 px-4 py-2 text-xs font-black uppercase tracking-wider text-center transition-colors ${
                viewMode === 'matrix' ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              {t('student.dashboard.matrixView', 'CẦN CẢI THIỆN')}
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`w-1/2 flex-1 px-4 py-2 text-xs font-black uppercase tracking-wider text-center border-l-2 border-zinc-900 transition-colors ${
                viewMode === 'radar' ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              {t('student.dashboard.radarView', 'BIỂU ĐỒ NĂNG LỰC')}
            </button>
          </div>
        )}
      </div>

      {viewMode === 'radar' ? (
        <StudentRadarChart topicsTree={topicsTree} weakTopics={weakTopics} />
      ) : (
        /* Bento Grid Weak Spots */
        <div className="space-y-3">
          {weakTopics.slice(0, 5).map((topic, i) => {
            const isSelected = selectedTopic?.toLowerCase() === topic.topic.toLowerCase();

            return (
              <div 
                key={i} 
                onClick={() => onSelectTopic && onSelectTopic(isSelected ? null : topic.topic)}
                className={`flex flex-col border-2 border-zinc-900 p-4 transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-zinc-900 text-white shadow-[4px_4px_0_0_#4f46e5]' 
                    : 'bg-white hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#4f46e5]'
                }`}
              >
                <div className="flex justify-between items-start gap-3 border-b-2 border-current pb-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-black text-lg tracking-tighter uppercase block break-words">
                      {topic.topic}
                    </span>
                    <span className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 inline-block ${
                      isSelected ? 'text-indigo-200' : 'text-zinc-500'
                    }`}>
                      {t('student.dashboard.clickToFilter', 'NHẤP ĐỂ LỌC BÀI TẬP')}
                    </span>
                  </div>
                  <span className={`shrink-0 whitespace-nowrap font-bold px-2.5 py-1 text-xs tracking-wider uppercase border border-current self-start ${
                    topic.trend === 'improving' ? 'bg-indigo-600 text-white' : 
                    topic.trend === 'declining' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-white'
                  }`}>
                    {topic.trend === 'improving' ? t('student.dashboard.improving', 'Tiến bộ') : 
                     topic.trend === 'declining' ? t('student.dashboard.declining', 'Cần chú ý') : 
                     t('student.dashboard.stable', 'Ổn định')}
                  </span>
                </div>

                <div className="flex items-center text-xs font-bold uppercase tracking-widest mt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={isSelected ? 'text-red-300' : 'text-red-600'}>
                      {topic.weak_questions} {t('student.dashboard.hardQs', 'CÂU HAY SAI')}
                    </span>
                    {topic.overdue_questions > 0 && (
                      <span className={isSelected ? 'text-amber-300' : 'text-amber-600'}>
                        {topic.overdue_questions} {t('student.dashboard.overdue', 'QUÁ HẠN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Filter } from 'lucide-react';
import type { WeakTopic, HierarchicalTopicNode } from '../types';

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
  const [viewMode, setViewMode] = useState<'matrix' | 'tree'>('matrix');

  if ((!weakTopics || weakTopics.length === 0) && (!topicsTree || topicsTree.length === 0)) {
    return null;
  }

  const calculateMastery = (avg_ef: number) => {
    const val = Number(avg_ef) || 2.5;
    return Math.min(100, Math.max(10, Math.round(((val - 1.3) / (2.5 - 1.3)) * 100)));
  };

  const renderTreeNode = (node: HierarchicalTopicNode, depth: number = 0) => {
    const isSelected = selectedTopic?.toLowerCase() === node.name.toLowerCase();
    const mastery = Math.round(Number(node.accuracy_pct) || 0);

    return (
      <div key={`tree-${node.id}`} className="space-y-2">
        <div 
          onClick={() => onSelectTopic && onSelectTopic(isSelected ? null : node.name)}
          className={`flex items-center justify-between p-3 border-2 border-zinc-900 cursor-pointer transition-all ${
            isSelected 
              ? 'bg-zinc-900 text-white shadow-[2px_2px_0_0_#4f46e5]' 
              : 'bg-white hover:bg-zinc-50'
          }`}
          style={{ marginLeft: `${depth * 14}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-tight uppercase">
              {node.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {node.weak_count > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 tracking-wider uppercase">
                {node.weak_count} {t('student.dashboard.weakTag', 'CẦN ÔN')}
              </span>
            )}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 tracking-wider uppercase ${
              node.status === 'MASTERED' ? 'bg-indigo-600 text-white' :
              node.status === 'WEAK' ? 'bg-red-100 text-red-800' : 'bg-zinc-200 text-zinc-800'
            }`}>
              {mastery > 0 ? `${mastery}% ` : ''}
              {node.status === 'MASTERED' ? t('student.dashboard.masteredTag', 'THÀNH THẠO') :
               node.status === 'WEAK' ? t('student.dashboard.weakTag', 'CẦN ÔN') :
               t('student.dashboard.stableTag', 'VỮNG VÀNG')}
            </span>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="space-y-1.5">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex justify-between items-end border-b-2 border-zinc-900 pb-2">
        <div>
          <span className="font-bold text-xs uppercase tracking-widest text-zinc-500">
            {t('student.dashboard.knowledgeMastery', 'CHẨN ĐOÁN HỌC TẬP')}
          </span>
          <h3 className="text-2xl font-black tracking-tighter uppercase">
            {t('student.dashboard.focusAreas', 'CHỦ ĐỀ CẦN CẢI THIỆN')}
          </h3>
        </div>

        {topicsTree.length > 0 && (
          <div className="flex border-2 border-zinc-900 bg-white">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 text-xs font-black uppercase tracking-wider transition-colors ${
                viewMode === 'matrix' ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              {t('student.dashboard.matrixView', 'DANH SÁCH YẾU')}
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 text-xs font-black uppercase tracking-wider border-l-2 border-zinc-900 transition-colors ${
                viewMode === 'tree' ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              {t('student.dashboard.treeView', 'CÂY KIẾN THỨC')}
            </button>
          </div>
        )}
      </div>

      {viewMode === 'tree' && topicsTree.length > 0 ? (
        /* Hierarchical Tree Explorer */
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {topicsTree.map(rootNode => renderTreeNode(rootNode, 0))}
        </div>
      ) : (
        /* Bento Grid Weak Spots */
        <div className="space-y-3">
          {weakTopics.slice(0, 5).map((topic, i) => {
            const isSelected = selectedTopic?.toLowerCase() === topic.topic.toLowerCase();
            const retentionPct = calculateMastery(topic.avg_ef);

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
                <div className="flex justify-between items-start border-b-2 border-current pb-2 mb-2">
                  <div>
                    <span className="font-black text-lg tracking-tighter uppercase block">
                      {topic.topic}
                    </span>
                    <span className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 inline-block ${
                      isSelected ? 'text-indigo-200' : 'text-zinc-500'
                    }`}>
                      {t('student.dashboard.clickToFilter', 'NHẤP ĐỂ LỌC BÀI TẬP')}
                    </span>
                  </div>
                  <span className={`font-bold px-2 py-0.5 text-xs tracking-widest uppercase border border-current ${
                    topic.trend === 'improving' ? 'bg-indigo-600 text-white' : 
                    topic.trend === 'declining' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-white'
                  }`}>
                    {topic.trend === 'improving' ? t('student.dashboard.improving', 'Tiến bộ') : 
                     topic.trend === 'declining' ? t('student.dashboard.declining', 'Cần chú ý') : 
                     t('student.dashboard.stable', 'Ổn định')}
                  </span>
                </div>

                {/* Progress Bar for retention score */}
                <div className="w-full h-2 border border-current bg-zinc-100 my-1 overflow-hidden">
                  <div 
                    style={{ width: `${retentionPct}%` }}
                    className={`h-full ${
                      retentionPct >= 80 ? 'bg-indigo-600' : 
                      retentionPct >= 50 ? 'bg-zinc-800' : 'bg-red-600'
                    }`}
                  />
                </div>

                <div className="flex justify-between items-end text-xs font-bold uppercase tracking-widest mt-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <span className={isSelected ? 'text-red-300' : 'text-red-600'}>
                      {topic.weak_questions} {t('student.dashboard.hardQs', 'CÂU HAY SAI')}
                    </span>
                    {topic.overdue_questions > 0 && (
                      <span className={isSelected ? 'text-amber-300' : 'text-amber-600'}>
                        {topic.overdue_questions} {t('student.dashboard.overdue', 'QUÁ HẠN')}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`block text-[10px] ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {t('student.dashboard.memoryScore', 'ĐỘ BỀN TRÍ NHỚ')}
                    </span>
                    <span className="text-base font-black">{retentionPct}%</span>
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


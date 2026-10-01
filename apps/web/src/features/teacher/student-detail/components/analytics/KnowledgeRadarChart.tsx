import React, { useState, useMemo } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTranslation } from 'react-i18next';
import type { StudentStats } from '../../types';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface KnowledgeRadarChartProps {
  topicPerformance: StudentStats['topic_performance'];
}

export const KnowledgeRadarChart: React.FC<KnowledgeRadarChartProps> = ({ topicPerformance }) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'detailed' | 'grouped'>('detailed');

  // Specific topics map (each leaf topic practiced by the student - matches other cards)
  const leafTopicsMap = useMemo(() => {
    const map = new Map<string, { totalAccuracy: number; count: number }>();
    if (!topicPerformance) return map;
    topicPerformance.forEach(tp => {
      const parts = tp.topic_path ? tp.topic_path.split(' ➔ ') : [tp.topic];
      const name = parts[parts.length - 1] || tp.topic;
      const current = map.get(name) || { totalAccuracy: 0, count: 0 };
      current.totalAccuracy += tp.accuracy_pct;
      current.count += 1;
      map.set(name, current);
    });
    return map;
  }, [topicPerformance]);

  // Grouped topics map (category branch topics)
  const branchTopicsMap = useMemo(() => {
    const map = new Map<string, { totalAccuracy: number; count: number }>();
    if (!topicPerformance) return map;
    topicPerformance.forEach(tp => {
      const parts = tp.topic_path ? tp.topic_path.split(' ➔ ') : [tp.topic];
      const name = parts.length > 1 ? parts[1] : parts[0];
      const current = map.get(name) || { totalAccuracy: 0, count: 0 };
      current.totalAccuracy += tp.accuracy_pct;
      current.count += 1;
      map.set(name, current);
    });
    return map;
  }, [topicPerformance]);

  if (!topicPerformance || topicPerformance.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('teacher.studentDetail.analytics.knowledgeGraph')}</h3>
        <p className="text-sm text-gray-500 text-center py-10">{t('teacher.studentDetail.analytics.notEnoughData')}</p>
      </div>
    );
  }

  const activeMap = viewMode === 'detailed' ? leafTopicsMap : branchTopicsMap;

  const formatShortLabel = (name: string): string => {
    let clean = name.includes('(') ? name.split('(')[0].trim() : name;
    return clean.length > 18 ? `${clean.slice(0, 17)}…` : clean;
  };

  const fullLabels: string[] = [];
  const labels: string[] = [];
  const dataPoints: number[] = [];

  Array.from(activeMap.entries()).forEach(([key, val]) => {
    fullLabels.push(key);
    labels.push(formatShortLabel(key));
    dataPoints.push(Math.round(val.totalAccuracy / val.count));
  });

  const data = {
    labels,
    datasets: [
      {
        label: t('teacher.studentDetail.analytics.accuracyPct'),
        data: dataPoints,
        backgroundColor: 'rgba(99, 102, 241, 0.22)', // indigo-500 with opacity
        borderColor: 'rgba(79, 70, 229, 0.85)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(79, 70, 229, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(79, 70, 229, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        min: 0,
        max: 100,
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.08)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
          circular: true,
        },
        pointLabels: {
          font: {
            family: "'Inter', sans-serif",
            size: viewMode === 'detailed' ? 11 : 12,
            weight: 600,
          },
          color: '#374151',
          padding: 14,
        },
        ticks: {
          stepSize: 20,
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 14,
        titleFont: { family: "'Inter', sans-serif", size: 13, weight: 600 as const },
        bodyFont: { family: "'Inter', sans-serif", size: 13 },
        displayColors: false,
        cornerRadius: 12,
        callbacks: {
          title: function(tooltipItems: any) {
            const item = tooltipItems[0];
            return fullLabels[item.dataIndex] || item.label;
          },
          label: function(context: any) {
            return t('teacher.studentDetail.analytics.accuracyLabel', { val: context.raw });
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{t('teacher.studentDetail.analytics.knowledgeGraphTitle')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === 'detailed'
              ? t('teacher.studentDetail.analytics.knowledgeGraphDescDetailed')
              : t('teacher.studentDetail.analytics.knowledgeGraphDescBranch')}
          </p>
        </div>
        {branchTopicsMap.size >= 3 && leafTopicsMap.size > branchTopicsMap.size && (
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'detailed'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('teacher.studentDetail.analytics.viewDetailed')} ({leafTopicsMap.size})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'grouped'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('teacher.studentDetail.analytics.viewGrouped')} ({branchTopicsMap.size})
            </button>
          </div>
        )}
      </div>

      <div className="relative w-full h-[450px] mt-4">
        {labels.length >= 3 ? (
          <div className="absolute inset-0">
            <Radar data={data} options={options} />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500 text-sm p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              {t('teacher.studentDetail.analytics.needMoreTopics', { count: labels.length })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

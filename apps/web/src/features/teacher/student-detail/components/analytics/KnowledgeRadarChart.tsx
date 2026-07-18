import React from 'react';
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

  if (!topicPerformance || topicPerformance.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('teacher.studentDetail.analytics.knowledgeGraph')}</h3>
        <p className="text-sm text-gray-500 text-center py-10">{t('teacher.studentDetail.analytics.notEnoughData')}</p>
      </div>
    );
  }

  // Group by root topic
  const rootTopicsMap = new Map<string, { totalAccuracy: number; count: number }>();

  topicPerformance.forEach(tp => {
    const rootName = tp.topic_path.split(' ➔ ')[0];
    const current = rootTopicsMap.get(rootName) || { totalAccuracy: 0, count: 0 };
    current.totalAccuracy += tp.accuracy_pct;
    current.count += 1;
    rootTopicsMap.set(rootName, current);
  });

  const labels: string[] = [];
  const dataPoints: number[] = [];

  rootTopicsMap.forEach((val, key) => {
    labels.push(key);
    dataPoints.push(Math.round(val.totalAccuracy / val.count));
  });

  const data = {
    labels,
    datasets: [
      {
        label: t('teacher.studentDetail.analytics.accuracyPct'),
        data: dataPoints,
        backgroundColor: 'rgba(79, 70, 229, 0.25)', // indigo-600 with opacity
        borderColor: 'rgba(79, 70, 229, 0.8)',
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
          circular: true, // cleaner look
        },
        pointLabels: {
          font: {
            family: "'Inter', sans-serif",
            size: 13,
            weight: 600,
          },
          color: '#374151', // gray-700
          padding: 24,
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
        backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900
        padding: 16,
        titleFont: { family: "'Inter', sans-serif", size: 14, weight: 600 as const },
        bodyFont: { family: "'Inter', sans-serif", size: 14 },
        displayColors: false,
        cornerRadius: 12,
        callbacks: {
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
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">{t('teacher.studentDetail.analytics.knowledgeGraphTitle')}</h3>
        <p className="text-sm text-gray-500 mt-1">{t('teacher.studentDetail.analytics.knowledgeGraphDesc')}</p>
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

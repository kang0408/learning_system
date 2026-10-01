import React, { useMemo } from 'react';
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
import { Brain } from 'lucide-react';
import type { HierarchicalTopicNode, WeakTopic } from '../types';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const FONT_FAMILY = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

interface StudentRadarChartProps {
  topicsTree?: HierarchicalTopicNode[];
  weakTopics?: WeakTopic[];
}

export const StudentRadarChart: React.FC<StudentRadarChartProps> = ({ 
  topicsTree = [], 
  weakTopics = [] 
}) => {
  const { t } = useTranslation();

  const calculateMastery = (avg_ef: number) => {
    const val = Number(avg_ef) || 2.5;
    return Math.min(100, Math.max(10, Math.round(((val - 1.3) / (2.5 - 1.3)) * 100)));
  };

  const chartData = useMemo(() => {
    interface TopicPoint {
      name: string;
      accuracy: number;
      retention: number;
      hasActivity: boolean;
      priority: number;
      weakQuestions?: number;
      trend?: string;
    }

    const pointsMap = new Map<string, TopicPoint>();

    // 1. Recursive helper to extract leaf / sub-topic nodes from topicsTree
    const collectFromTree = (node: HierarchicalTopicNode, isRoot: boolean = false) => {
      const hasChildren = node.children && node.children.length > 0;
      const hasActivity = (Number(node.total_questions) > 0) || 
                          (Number(node.accuracy_pct) > 0) || 
                          (Number(node.weak_count) > 0) || 
                          (Number(node.mastered_count) > 0);

      // Collect leaf nodes or nodes with questions answered directly
      if (!isRoot || !hasChildren || hasActivity) {
        const accuracy = Math.round(Number(node.accuracy_pct) || 0);
        const retention = Math.round(Number(node.mastery_percentage) || Number(node.accuracy_pct) || 50);

        pointsMap.set(node.name, {
          name: node.name,
          accuracy,
          retention,
          hasActivity,
          priority: hasActivity ? 2 : (isRoot ? 0 : 1),
          weakQuestions: Number(node.weak_count) || 0,
        });
      }

      if (hasChildren) {
        node.children.forEach(child => collectFromTree(child, false));
      }
    };

    topicsTree.forEach(root => collectFromTree(root, true));

    // 2. Merge with weakTopics to ensure all practiced / weak topics are present with accurate metrics
    weakTopics.forEach(wt => {
      const existing = pointsMap.get(wt.topic);
      const retention = calculateMastery(wt.avg_ef);
      const accuracy = Math.round(Number(wt.accuracy_pct) || 0);

      pointsMap.set(wt.topic, {
        name: wt.topic,
        accuracy: existing && existing.accuracy > 0 ? existing.accuracy : accuracy,
        retention,
        hasActivity: true,
        priority: 3,
        weakQuestions: wt.weak_questions,
        trend: wt.trend,
      });
    });

    // 3. Fallback: If still < 3 topics, include root categories as well so the chart can render
    if (pointsMap.size < 3 && topicsTree.length > 0) {
      topicsTree.forEach(root => {
        if (!pointsMap.has(root.name)) {
          pointsMap.set(root.name, {
            name: root.name,
            accuracy: Math.round(Number(root.accuracy_pct) || 0),
            retention: Math.round(Number(root.mastery_percentage) || Number(root.accuracy_pct) || 50),
            hasActivity: Number(root.total_questions) > 0,
            priority: 0,
            weakQuestions: Number(root.weak_count) || 0,
          });
        }
      });
    }

    // 4. Sort topics: prioritize topics with student activity / practice first
    const sortedEntries = Array.from(pointsMap.values()).sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (b.hasActivity !== a.hasActivity) return (b.hasActivity ? 1 : 0) - (a.hasActivity ? 1 : 0);
      return b.accuracy - a.accuracy;
    });

    const activeEntries = sortedEntries.filter(e => e.hasActivity);
    const selectedEntries = activeEntries.length >= 3 
      ? activeEntries.slice(0, 7)
      : sortedEntries.slice(0, 7);

    const labels = selectedEntries.map(e => {
      const name = e.name;
      if (name.length <= 14) return name;
      const words = name.split(' ');
      if (words.length > 1) {
        const mid = Math.ceil(words.length / 2);
        const l1 = words.slice(0, mid).join(' ');
        const l2 = words.slice(mid).join(' ');
        if (l1.length <= 16 && l2.length <= 16) {
          return [l1, l2];
        }
        return [
          l1.length > 15 ? `${l1.slice(0, 14)}…` : l1,
          l2.length > 15 ? `${l2.slice(0, 14)}…` : l2,
        ];
      }
      return name.length > 16 ? `${name.slice(0, 15)}…` : name;
    });

    const accuracyData = selectedEntries.map(e => e.accuracy);
    const retentionData = selectedEntries.map(e => e.retention);

    return {
      labels,
      selectedEntries,
      accuracyData,
      retentionData,
      hasEnoughData: labels.length >= 3
    };
  }, [topicsTree, weakTopics]);

  if (!chartData.hasEnoughData) {
    return (
      <div className="border-2 border-zinc-900 bg-white p-8 text-center space-y-4">
        <div className="inline-flex p-3 bg-indigo-50 border-2 border-zinc-900 rounded-full">
          <Brain className="w-8 h-8 text-indigo-600" />
        </div>
        <h4 className="text-xl font-black uppercase tracking-tight text-zinc-900">
          {t('student.dashboard.radarTitle', 'TỔNG QUAN NĂNG LỰC')}
        </h4>
        <p className="text-sm font-medium text-zinc-500 max-w-md mx-auto">
          {t('student.dashboard.notEnoughTopicsForRadar', 'Cần hoàn thành bài tập ở ít nhất 3 chủ đề để xem biểu đồ so sánh năng lực.')}
        </p>
      </div>
    );
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: t('student.dashboard.accuracyLegend', 'Độ chính xác (%)'),
        data: chartData.accuracyData,
        backgroundColor: 'rgba(79, 70, 229, 0.25)', // Indigo-600 with 25% opacity
        borderColor: '#4f46e5',
        borderWidth: 2.5,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#4f46e5',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('student.dashboard.retentionLegend', 'Khả năng ghi nhớ (%)'),
        data: chartData.retentionData,
        backgroundColor: 'rgba(16, 185, 129, 0.25)', // Emerald-500 with 25% opacity
        borderColor: '#10b981',
        borderWidth: 2.5,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#10b981',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 35,
        right: 35,
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          display: true,
          backdropColor: 'transparent',
          color: '#71717a',
          font: {
            family: FONT_FAMILY,
            size: 10,
            weight: 600,
          },
        },
        angleLines: {
          display: true,
          color: 'rgba(24, 24, 27, 0.15)',
          lineWidth: 1.5,
        },
        grid: {
          color: 'rgba(24, 24, 27, 0.1)',
          circular: true,
        },
        pointLabels: {
          font: {
            family: FONT_FAMILY,
            size: 11,
            weight: 700,
          },
          color: '#18181b',
          padding: 10,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          boxWidth: 14,
          boxHeight: 14,
          padding: 16,
          font: {
            family: FONT_FAMILY,
            size: 11,
            weight: 700,
          },
          color: '#18181b',
        },
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#ffffff',
        bodyColor: '#f4f4f5',
        borderColor: '#3f3f46',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        cornerRadius: 4,
        displayColors: true,
        titleFont: {
          family: FONT_FAMILY,
          size: 12,
          weight: 700,
        },
        bodyFont: {
          family: FONT_FAMILY,
          size: 11,
          weight: 500,
        },
        callbacks: {
          // Display the full untruncated topic name in tooltip
          title: (items: any[]) => {
            if (!items || !items.length) return '';
            const idx = items[0].dataIndex;
            const entry = chartData.selectedEntries[idx];
            return entry ? entry.name : (Array.isArray(items[0].label) ? items[0].label.join(' ') : items[0].label);
          },
          label: (item: any) => {
            const datasetLabel = item.dataset.label || '';
            const val = item.raw;
            return ` ${datasetLabel}: ${val}%`;
          },
          afterBody: (items: any[]) => {
            if (!items || !items.length) return [];
            const idx = items[0].dataIndex;
            const entry = chartData.selectedEntries[idx];
            if (!entry) return [];
            const lines: string[] = [];
            if (entry.weakQuestions && entry.weakQuestions > 0) {
              lines.push(` Lưu ý: ${entry.weakQuestions} câu hay sai`);
            } else if (entry.accuracy >= 80) {
              lines.push(` Đánh giá: Nắm vững kiến thức`);
            } else {
              lines.push(` Đánh giá: Đang hoàn thiện`);
            }
            return lines;
          },
        },
      },
    },
  };

  return (
    <div className="border-2 border-zinc-900 bg-white p-5 space-y-4 shadow-[4px_4px_0_0_#18181b]">
      <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
        <div>
          <span className="font-bold text-[10px] uppercase tracking-widest text-indigo-600 block">
            {t('student.dashboard.radarTitle', 'TỔNG QUAN NĂNG LỰC')}
          </span>
          <h4 className="text-base sm:text-lg font-black tracking-tight uppercase text-zinc-900">
            {t('student.dashboard.radarDesc', 'SO SÁNH ĐỘ CHÍNH XÁC VÀ KHẢ NĂNG GHI NHỚ')}
          </h4>
        </div>
      </div>

      <div className="relative w-full h-[390px] sm:h-[410px]">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
};

export default StudentRadarChart;

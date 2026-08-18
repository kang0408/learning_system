import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Activity, CheckCircle, Clock } from 'lucide-react';
import type { StudentStats } from '../types';
import { StatCard } from '@/components/ui/StatCard';

interface StudentStatsOverviewProps {
  stats: StudentStats;
}

export const StudentStatsOverview: React.FC<StudentStatsOverviewProps> = ({ stats }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
      <StatCard
        title={t('teacher.studentDetail.stats.sessions')}
        value={stats.total_sessions || 0}
        icon={<Activity className="w-5 h-5" />}
      />
      <StatCard
        title={t('teacher.studentDetail.stats.questions')}
        value={stats.total_questions_answered || 0}
        icon={<Clock className="w-5 h-5 text-indigo-600" />}
      />
      <StatCard
        title={t('teacher.studentDetail.stats.accuracy')}
        value={`${stats.overall_accuracy?.toFixed(1) || 0}%`}
        icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
      />
      <StatCard
        title={t('teacher.studentDetail.stats.streak')}
        value={stats.current_streak_days || 0}
        icon={<Flame className="w-5 h-5 text-orange-500" />}
      />
    </div>
  );
};


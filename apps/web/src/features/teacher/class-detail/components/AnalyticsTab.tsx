import { useState } from 'react';
import { Trophy, Users, Percent, Award, BarChart2, CheckCircle2, BookOpen, Plus } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTopicStudents } from '../hooks/useClassDetailData';
import { Dialog } from '@/components/ui/Dialog';
import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/ui/StatCard';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnalyticsTabProps {
  classStats: any;
  analytics: any;
  classId: string;
}

export function AnalyticsTab({ classStats, analytics, classId }: AnalyticsTabProps) {
  const { t } = useTranslation();
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; name: string } | null>(null);
  
  const { data: topicStudents = [], isLoading: modalLoading } = useTopicStudents(
    classId, 
    selectedTopic?.id || null
  );

  const sortedTopics = analytics?.topic_accuracy ? [...analytics.topic_accuracy].sort((a: any, b: any) => b.accuracy - a.accuracy) : [];
  
  const chartData = {
    labels: sortedTopics.map(t => t.topic),
    datasets: [{
      label: t('teacher.classDetail.accuracy'),
      data: sortedTopics.map(t => t.accuracy),
      backgroundColor: sortedTopics.map(t =>
        t.accuracy >= 70 ? 'rgba(16, 185, 129, 0.85)' :
          t.accuracy >= 40 ? 'rgba(245, 158, 11, 0.85)' :
            'rgba(239, 68, 68, 0.85)'
      ),
      borderColor: sortedTopics.map(t =>
        t.accuracy >= 70 ? 'rgb(16, 185, 129)' :
          t.accuracy >= 40 ? 'rgb(245, 158, 11)' :
            'rgb(239, 68, 68)'
      ),
      borderWidth: 1.5,
      borderRadius: 6,
      barThickness: 24,
    }]
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${t('teacher.classDetail.accuracy')}: ${context.raw}%`
        },
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleFont: { size: 13, weight: 'bold' as const },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(243, 244, 246, 0.8)' },
        ticks: { font: { family: 'Inter', size: 12 }, color: '#6b7280' }
      },
      y: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 12, weight: 'bold' as const }, color: '#374151' }
      }
    },
    onClick: (_event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const topic = sortedTopics[index];
        setSelectedTopic({ id: topic.topic_id, name: topic.topic });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title={t('teacher.classDetail.totalStudents')} value={classStats?.total_students || 0} icon={<Users className="w-5 h-5" />} />
        <StatCard 
          title={t('teacher.classDetail.weeklyActivity')} 
          value={classStats?.active_students?.current || 0} 
          trend={classStats?.active_students?.trend ? { value: classStats.active_students.trend, isPositive: classStats.active_students.trend === 'up' } : undefined} 
          icon={<Trophy className="w-5 h-5" />} 
        />
        <StatCard 
          title={t('teacher.classDetail.submissionRate')} 
          value={`${classStats?.completion_rate?.current || 0}%`} 
          trend={classStats?.completion_rate?.trend ? { value: classStats.completion_rate.trend, isPositive: classStats.completion_rate.trend === 'up' } : undefined} 
          icon={<Percent className="w-5 h-5" />} 
        />
        <StatCard 
          title={t('teacher.classDetail.averageScore')} 
          value={`${classStats?.average_score?.current || 0} pts`} 
          trend={classStats?.average_score?.trend ? { value: classStats.average_score.trend, isPositive: classStats.average_score.trend === 'up' } : undefined} 
          icon={<Award className="w-5 h-5" />} 
        />
      </div>

      {classStats?.sm2_summary && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-600" aria-hidden="true" /> {t('teacher.classDetail.sm2Status')}
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {t('teacher.classDetail.sm2Overview', { total: classStats.sm2_summary.total_questions })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-500">{t('teacher.classDetail.dueToday')}</div>
              <div className="text-2xl font-extrabold text-red-600">{classStats.sm2_summary.due_today} {t('teacher.classDetail.questionsCount')}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SM2Card 
              title={t('teacher.classDetail.mastered')} 
              pct={classStats.sm2_summary.mastered.pct} 
              count={classStats.sm2_summary.mastered.count} 
              icon={<CheckCircle2 className="w-4 h-4" />} 
              theme="emerald" 
              t={t}
            />
            <SM2Card 
              title={t('teacher.classDetail.learning')} 
              pct={classStats.sm2_summary.learning.pct} 
              count={classStats.sm2_summary.learning.count} 
              extra={t('teacher.classDetail.atRisk', { count: classStats.sm2_summary.learning.at_risk })}
              icon={<BookOpen className="w-4 h-4" />} 
              theme="blue" 
              t={t}
            />
            <SM2Card 
              title={t('teacher.classDetail.newKnowledge')} 
              pct={classStats.sm2_summary.new.pct} 
              count={classStats.sm2_summary.new.count} 
              icon={<Plus className="w-4 h-4" />} 
              theme="slate" 
              t={t}
            />
          </div>

          <div className="mt-6 w-full h-3 bg-slate-100 rounded-full overflow-hidden flex" aria-hidden="true">
            <div className="h-full bg-emerald-500" style={{ width: `${classStats.sm2_summary.mastered.pct}%` }}></div>
            <div className="h-full bg-blue-500" style={{ width: `${classStats.sm2_summary.learning.pct}%` }}></div>
            <div className="h-full bg-slate-300" style={{ width: `${classStats.sm2_summary.new.pct}%` }}></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-slate-900" aria-hidden="true" /> {t('teacher.classDetail.accuracyByTopic')}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {t('teacher.classDetail.clickChartToViewDetails')}
          </p>
        </div>
        {sortedTopics.length > 0 ? (
          <div className="h-[360px] relative">
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 font-medium text-sm">
            {t('teacher.classDetail.noTopicData')}
          </div>
        )}
      </div>

      <Dialog
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        title={t('teacher.classDetail.studentDetailsTitle', { name: selectedTopic?.name })}
        description={t('teacher.classDetail.studentDetailsDesc')}
      >
        {modalLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        ) : topicStudents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('teacher.classDetail.student')}</TableHead>
                <TableHead>{t('teacher.classDetail.score')}</TableHead>
                <TableHead className="text-center">{t('teacher.classDetail.accuracy')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topicStudents.map((s: any) => (
                <TableRow key={s.student_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback name={s.name} />
                      </Avatar>
                      <span className="font-bold text-slate-900">{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">{s.score}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={s.accuracy_pct >= 75 ? 'success' : 'danger'}>
                      {s.accuracy_pct}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-slate-500 font-medium text-sm">{t('teacher.classDetail.noStudentTopicData')}</div>
        )}
      </Dialog>
    </div>
  );
}

function SM2Card({ title, pct, count, icon, theme, extra, t }: any) {
  const themes: any = {
    emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-700',
    blue: 'bg-blue-50/50 border-blue-100 text-blue-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
  };
  return (
    <div className={`p-5 rounded-2xl border ${themes[theme]}`}>
      <div className="text-sm font-bold flex items-center gap-2 mb-2">{icon} {title}</div>
      <div className="text-3xl font-extrabold mb-1">{Math.round(pct)}%</div>
      <div className="text-sm font-medium flex justify-between">
        <span>{t('teacher.classDetail.totalCount', { count })}</span>
        {extra && <span className="text-red-500 font-bold">{extra}</span>}
      </div>
    </div>
  );
}


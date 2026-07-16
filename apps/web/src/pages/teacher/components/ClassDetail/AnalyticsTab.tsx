import React, { useState } from 'react';
import { Trophy, Users, Percent, Award, BarChart2, CheckCircle2, BookOpen, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTopicStudents } from '../../hooks/useClassQueries';
import { Dialog } from '../../../../components/ui/Dialog';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnalyticsTabProps {
  classStats: any;
  analytics: any;
  classId: string;
}

export function AnalyticsTab({ classStats, analytics, classId }: AnalyticsTabProps) {
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; name: string } | null>(null);
  
  const { data: topicStudents = [], isLoading: modalLoading } = useTopicStudents(
    classId, 
    selectedTopic?.id || null
  );

  const sortedTopics = analytics?.topic_accuracy ? [...analytics.topic_accuracy].sort((a: any, b: any) => b.accuracy - a.accuracy) : [];
  
  const chartData = {
    labels: sortedTopics.map(t => t.topic),
    datasets: [{
      label: 'Tỷ lệ chính xác (%)',
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
          label: (context: any) => ` Tỷ lệ chính xác: ${context.raw}%`
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
        <StatCard title="Tổng số học sinh" value={classStats?.total_students || 0} icon={<Users className="w-6 h-6" />} color="blue" />
        <StatCard 
          title="Hoạt động tuần này" 
          value={classStats?.active_students?.current || 0} 
          trend={classStats?.active_students?.trend} 
          icon={<Trophy className="w-6 h-6" />} 
          color="slate" 
        />
        <StatCard 
          title="Tỷ lệ nộp bài" 
          value={`${classStats?.completion_rate?.current || 0}%`} 
          trend={classStats?.completion_rate?.trend} 
          icon={<Percent className="w-6 h-6" />} 
          color="emerald" 
        />
        <StatCard 
          title="Điểm trung bình" 
          value={`${classStats?.average_score?.current || 0} pts`} 
          trend={classStats?.average_score?.trend} 
          icon={<Award className="w-6 h-6" />} 
          color="amber" 
        />
      </div>

      {classStats?.sm2_summary && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-600" aria-hidden="true" /> Trạng thái trí nhớ SM2
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Tổng quan quá trình ghi nhớ kiến thức của toàn bộ học sinh (tổng {classStats.sm2_summary.total_questions} lượt).
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-500">Cần ôn tập hôm nay</div>
              <div className="text-2xl font-bold text-red-600">{classStats.sm2_summary.due_today} câu</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SM2Card 
              title="Đã thành thạo (Mastered)" 
              pct={classStats.sm2_summary.mastered.pct} 
              count={classStats.sm2_summary.mastered.count} 
              icon={<CheckCircle2 className="w-4 h-4" />} 
              theme="emerald" 
            />
            <SM2Card 
              title="Đang học (Learning)" 
              pct={classStats.sm2_summary.learning.pct} 
              count={classStats.sm2_summary.learning.count} 
              extra={`Nguy cơ: ${classStats.sm2_summary.learning.at_risk}`}
              icon={<BookOpen className="w-4 h-4" />} 
              theme="blue" 
            />
            <SM2Card 
              title="Kiến thức mới (New)" 
              pct={classStats.sm2_summary.new.pct} 
              count={classStats.sm2_summary.new.count} 
              icon={<Plus className="w-4 h-4" />} 
              theme="slate" 
            />
          </div>

          <div className="mt-6 w-full h-3 bg-slate-100 rounded-full overflow-hidden flex" aria-hidden="true">
            <div className="h-full bg-emerald-500" style={{ width: `${classStats.sm2_summary.mastered.pct}%` }}></div>
            <div className="h-full bg-blue-500" style={{ width: `${classStats.sm2_summary.learning.pct}%` }}></div>
            <div className="h-full bg-slate-300" style={{ width: `${classStats.sm2_summary.new.pct}%` }}></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-slate-900" aria-hidden="true" /> Tỷ lệ chính xác theo chủ đề
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Nhấn vào thanh biểu đồ để xem chi tiết học sinh.
          </p>
        </div>
        {sortedTopics.length > 0 ? (
          <div className="h-[360px] relative">
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            Chưa có dữ liệu thống kê chủ đề.
          </div>
        )}
      </div>

      <Dialog
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        title={`Chi tiết học sinh - ${selectedTopic?.name}`}
        description="Danh sách học sinh học tập chủ đề này, xếp theo tỷ lệ chính xác."
      >
        {modalLoading ? (
          <div className="flex justify-center items-center py-8">
            <span className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 animate-spin rounded-full"></span>
          </div>
        ) : topicStudents.length > 0 ? (
          <div className="overflow-y-auto max-h-[50vh] border border-gray-100 rounded-xl">
            <table className="min-w-full divide-y divide-gray-150 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="font-semibold text-gray-500">
                  <th className="px-4 py-3 text-left">Học sinh</th>
                  <th className="px-4 py-3 text-left">Điểm</th>
                  <th className="px-4 py-3 text-center">Chính xác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {topicStudents.map((s: any) => (
                  <tr key={s.student_id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-900 flex items-center justify-center font-bold mr-3 text-xs">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        {s.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold">{s.score}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${s.accuracy_pct >= 75 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {s.accuracy_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Chưa có học sinh làm bài tập chủ đề này.</div>
        )}
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-900',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition duration-300 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-500">{title}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">{value}</h3>
          {trend && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold ${trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {trend === 'up' ? 'Tăng' : 'Giảm'}
            </span>
          )}
        </div>
      </div>
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>
    </div>
  );
}

function SM2Card({ title, pct, count, icon, theme, extra }: any) {
  const themes: any = {
    emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-700',
    blue: 'bg-blue-50/50 border-blue-100 text-blue-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
  };
  return (
    <div className={`p-5 rounded-xl border ${themes[theme]}`}>
      <div className="text-sm font-bold flex items-center gap-2 mb-2">{icon} {title}</div>
      <div className="text-3xl font-extrabold mb-1">{Math.round(pct)}%</div>
      <div className="text-sm font-medium flex justify-between">
        <span>Tổng: {count}</span>
        {extra && <span className="text-red-500 font-bold">{extra}</span>}
      </div>
    </div>
  );
}

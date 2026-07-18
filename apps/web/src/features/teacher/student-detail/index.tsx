import React from 'react';
import { useParams } from 'react-router-dom';
import { useTeacherStudentDetail } from './hooks/useTeacherStudentDetail';
import { StudentDetailHeader } from './components/StudentDetailHeader';
import { StudentStatsOverview } from './components/StudentStatsOverview';
import { StudentSm2Status } from './components/StudentSm2Status';
import { StudentWeakTopics } from './components/StudentWeakTopics';
import { StudentAssignmentsList } from './components/StudentAssignmentsList';
import { SkillTreeTable } from './components/analytics/SkillTreeTable';

const KnowledgeRadarChart = React.lazy(() => 
  import('./components/analytics/KnowledgeRadarChart').then(module => ({ default: module.KnowledgeRadarChart }))
);

export default function TeacherStudentDetailFeature() {
  const { id: classId, studentId } = useParams<{ id: string, studentId: string }>();
  if (!classId || !studentId) return null;

  const { data } = useTeacherStudentDetail(classId, studentId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      <StudentDetailHeader classId={classId} studentInfo={data.studentInfo} />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <StudentStatsOverview stats={data.stats} />
          
          <React.Suspense fallback={<div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex items-center justify-center min-h-[450px]"><span className="text-gray-500 text-sm">Đang tải biểu đồ...</span></div>}>
            <KnowledgeRadarChart topicPerformance={data.stats.topic_performance} />
          </React.Suspense>
          
          <StudentWeakTopics weakTopics={data.stats.weak_topics} />
          
          <SkillTreeTable topicPerformance={data.stats.topic_performance} />
          
          <StudentSm2Status sm2Summary={data.stats.sm2_summary} />
        </div>

        <div className="xl:col-span-1 xl:sticky xl:top-6 self-start space-y-8">
          <StudentAssignmentsList assignments={data.assignments} />
        </div>
      </div>
    </div>
  );
}

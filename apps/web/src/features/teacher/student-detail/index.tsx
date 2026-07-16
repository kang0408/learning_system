import React from 'react';
import { useParams } from 'react-router-dom';
import { useTeacherStudentDetail } from './hooks/useTeacherStudentDetail';
import { StudentDetailHeader } from './components/StudentDetailHeader';
import { StudentStatsOverview } from './components/StudentStatsOverview';
import { StudentSm2Status } from './components/StudentSm2Status';
import { StudentWeakTopics } from './components/StudentWeakTopics';
import { StudentAssignmentsList } from './components/StudentAssignmentsList';

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
          <StudentSm2Status sm2Summary={data.stats.sm2_summary} />
          <StudentWeakTopics weakTopics={data.stats.weak_topics} />
        </div>

        <div className="xl:col-span-1">
          <StudentAssignmentsList assignments={data.assignments} />
        </div>
      </div>
    </div>
  );
}

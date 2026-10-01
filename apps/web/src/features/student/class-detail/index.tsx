import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useClassDetailData } from './hooks/useClassDetailData';
import { ClassHeader, type StudentClassTab } from './components/ClassHeader';
import { StudentTeacherFeedbackCard } from './components/StudentTeacherFeedbackCard';
import { StudentCurriculumTab } from './components/StudentCurriculumTab';
import { ClassAssignments } from './components/ClassAssignments';

export const StudentClassDetailFeature: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as StudentClassTab) || 'curriculum';
  const setActiveTab = (tab: StudentClassTab) => setSearchParams({ tab });

  // Should never happen since route requires :id, but safe fallback
  if (!id) return null;

  const { classData, assignments, curriculums } = useClassDetailData(id);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <ClassHeader
        classData={classData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <StudentTeacherFeedbackCard
        teacherName={classData.teacher?.full_name}
        feedback={classData.teacher_feedback}
        updatedAt={classData.feedback_updated_at}
      />

      <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`} className="animate-in fade-in duration-300">
        {activeTab === 'curriculum' ? (
          <StudentCurriculumTab
            curriculums={curriculums}
            classId={id}
          />
        ) : (
          <ClassAssignments assignments={assignments} />
        )}
      </div>
    </div>
  );
};

export default StudentClassDetailFeature;

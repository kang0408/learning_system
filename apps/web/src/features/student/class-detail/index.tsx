import React from 'react';
import { useParams } from 'react-router-dom';
import { useClassDetailData } from './hooks/useClassDetailData';
import { ClassHeader } from './components/ClassHeader';
import { ClassAssignments } from './components/ClassAssignments';

export const StudentClassDetailFeature: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Should never happen since route requires :id, but safe fallback
  if (!id) return null;

  const { classData, assignments } = useClassDetailData(id);

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <ClassHeader classData={classData} />
      <ClassAssignments assignments={assignments} />
    </div>
  );
};

export default StudentClassDetailFeature;

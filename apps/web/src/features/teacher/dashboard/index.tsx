import React, { useState } from 'react';
import { useTeacherDashboardData, useCreateClass } from './hooks/useTeacherDashboardData';
import { DashboardHeader } from './components/DashboardHeader';
import { ClassCard } from './components/ClassCard';
import { EmptyState } from './components/EmptyState';
import { CreateClassModal } from './components/CreateClassModal';

export const TeacherDashboardFeature: React.FC = () => {
  const { data: classes } = useTeacherDashboardData();
  const { mutateAsync: createClass, isPending: isCreating } = useCreateClass();
  const [showModal, setShowModal] = useState(false);

  const handleCreateClass = async (payload: any) => {
    try {
      await createClass(payload);
      setShowModal(false);
    } catch (err) {
      alert('Failed to create class');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 mb-16">
      <DashboardHeader 
        totalClasses={classes.length} 
        onCreateClick={() => setShowModal(true)} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {classes.length > 0 ? (
          classes.map(cls => (
            <ClassCard key={cls.id} cls={cls} />
          ))
        ) : (
          <EmptyState onCreateClick={() => setShowModal(true)} />
        )}
      </div>

      {showModal && (
        <CreateClassModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateClass}
          isCreating={isCreating}
        />
      )}
    </div>
  );
};

export default TeacherDashboardFeature;

import React, { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useClassDetailData, useClassMutations } from './hooks/useClassDetailData';
import { ClassHeader, type ClassDetailTab } from './components/ClassHeader';
import { AnalyticsTab } from './components/AnalyticsTab';
import { StudentsTab } from './components/StudentsTab';
import { AssignmentsTab } from './components/AssignmentsTab';
import { CurriculumTab } from './components/CurriculumTab';
import { EditClassModal } from './components/EditClassModal';
import { DeleteClassModal } from './components/DeleteClassModal';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

export const TeacherClassDetailFeature: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as ClassDetailTab) || 'analytics';
  const setActiveTab = (tab: ClassDetailTab) => setSearchParams({ tab });
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Single parallel request using Suspense
  const { data } = useClassDetailData(id || '');
  const { classDetails, classStats, analytics, members, assignments } = data;
  
  const { updateClass, deleteClass } = useClassMutations(id || '');

  const handleEditSubmit = async (payload: { name: string; subject?: string; description?: string }) => {
    try {
      await updateClass.mutateAsync(payload);
      toast.success(t('teacher.classDetail.updateClassSuccess'));
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.classDetail.updateClassError'));
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteClass.mutateAsync();
      toast.success(t('teacher.classDetail.deleteClassSuccess'));
      setShowDeleteModal(false);
      navigate('/teacher');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.classDetail.deleteClassError'));
    }
  };

  if (!classDetails) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] rounded-none p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mb-2">{t('teacher.classDetail.classNotFound')}</h3>
        <p className="text-zinc-500 font-bold uppercase tracking-wider mb-8">{t('teacher.classDetail.cannotLoadClass')}</p>
        <Link 
          to="/teacher" 
          className="inline-flex items-center px-6 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest border-2 border-zinc-900 hover:bg-indigo-600 transition-colors shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> {t('teacher.classDetail.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-8xl mx-auto px-4 sm:px-6 mb-16 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <ClassHeader 
        classDetails={classDetails} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onEditClick={() => setShowEditModal(true)}
        onDeleteClick={() => setShowDeleteModal(true)}
      />

      <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            classStats={classStats} 
            analytics={analytics} 
            classId={id || ''} 
          />
        )}

        {activeTab === 'curriculum' && (
          <CurriculumTab
            classId={id || ''}
            assignments={assignments}
          />
        )}
        
        {activeTab === 'students' && (
          <StudentsTab 
            analytics={analytics} 
            members={members} 
            classId={id || ''} 
          />
        )}
        
        {activeTab === 'assignments' && (
          <AssignmentsTab 
            assignments={assignments} 
            classStats={classStats} 
            membersCount={members.length} 
            classId={id || ''} 
          />
        )}
      </div>

      {showEditModal && (
        <EditClassModal 
          initialData={classDetails}
          isUpdating={updateClass.isPending}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {showDeleteModal && (
        <DeleteClassModal
          className={classDetails.name}
          isDeleting={deleteClass.isPending}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default TeacherClassDetailFeature;

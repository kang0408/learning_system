import React, { useState, useTransition } from 'react';
import { useParams } from 'react-router-dom';
import { useClassMembersData, useRemoveMember } from './hooks/useTeacherClassMembers';
import { MembersHeader } from './components/MembersHeader';
import { MembersList } from './components/MembersList';
import { Pagination } from './components/Pagination';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

export const TeacherClassMembersFeature: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const { data: response } = useClassMembersData(id || '', page);
  const { mutateAsync: removeMember, isPending: isRemoving } = useRemoveMember(id || '');

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      setPage(newPage);
    });
  };

  const handleRemove = async (studentId: string) => {
    if (!window.confirm(t('teacher.classMembers.confirmRemove'))) return;
    try {
      await removeMember(studentId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('teacher.classMembers.errorGeneric'));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
      <MembersHeader classId={id || ''} />

      <div className="flex flex-col opacity-100 transition-opacity duration-300">
        <MembersList 
          classId={id || ''}
          members={response.data} 
          isRemoving={isRemoving}
          onRemove={handleRemove} 
        />
        <Pagination 
          page={page} 
          total={response.meta.total} 
          limit={response.meta.limit} 
          isPending={isPending}
          onPageChange={handlePageChange} 
        />
      </div>
    </div>
  );
};

export default TeacherClassMembersFeature;

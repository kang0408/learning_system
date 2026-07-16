import React, { useState, useTransition } from 'react';
import { useParams } from 'react-router-dom';
import { useClassMembersData, useRemoveMember } from './hooks/useTeacherClassMembers';
import { MembersHeader } from './components/MembersHeader';
import { MembersList } from './components/MembersList';
import { Pagination } from './components/Pagination';

export const TeacherClassMembersFeature: React.FC = () => {
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?')) return;
    try {
      await removeMember(studentId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
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

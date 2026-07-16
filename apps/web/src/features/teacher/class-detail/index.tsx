import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useClassDetailData } from './hooks/useClassDetailData';
import { ClassHeader } from './components/ClassHeader';
import { AnalyticsTab } from './components/AnalyticsTab';
import { StudentsTab } from './components/StudentsTab';
import { AssignmentsTab } from './components/AssignmentsTab';

export const TeacherClassDetailFeature: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'analytics' | 'students' | 'assignments'>('analytics');
  
  // Single parallel request using Suspense
  const { data } = useClassDetailData(id || '');
  const { classDetails, classStats, analytics, members, assignments } = data;

  if (!classDetails) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] rounded-none p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mb-2">Lớp học không tồn tại</h3>
        <p className="text-zinc-500 font-bold uppercase tracking-wider mb-8">Không thể tải thông tin lớp học này.</p>
        <Link 
          to="/teacher" 
          className="inline-flex items-center px-6 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest border-2 border-zinc-900 hover:bg-indigo-600 transition-colors shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 mb-16 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <ClassHeader 
        classDetails={classDetails} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            classStats={classStats} 
            analytics={analytics} 
            classId={id || ''} 
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
    </div>
  );
};

export default TeacherClassDetailFeature;

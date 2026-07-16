import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { 
  useClassDetails, 
  useClassStats, 
  useClassAnalytics, 
  useClassMembers, 
  useClassAssignments 
} from './hooks/useClassQueries';
import { ClassHeader } from './components/ClassDetail/ClassHeader';
import { AnalyticsTab } from './components/ClassDetail/AnalyticsTab';
import { StudentsTab } from './components/ClassDetail/StudentsTab';
import { AssignmentsTab } from './components/ClassDetail/AssignmentsTab';

export default function TeacherClassDetail() {
  const { id } = useParams<{ id: string }>();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'students' | 'assignments'>('analytics');

  // React Query hooks for fetching data
  const { data: classDetails, isLoading: loadingDetails, isError: errorDetails } = useClassDetails(id || '');
  const { data: classStats, isLoading: loadingStats } = useClassStats(id || '');
  const { data: analytics, isLoading: loadingAnalytics } = useClassAnalytics(id || '');
  const { data: members = [], isLoading: loadingMembers } = useClassMembers(id || '');
  const { data: assignments = [], isLoading: loadingAssignments } = useClassAssignments(id || '');

  const isLoading = loadingDetails || loadingStats || loadingAnalytics || loadingMembers || loadingAssignments;
  const isError = errorDetails;

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4 animate-in fade-in duration-500">
        <Loader2 className="w-12 h-12 animate-spin text-slate-900" />
        <p className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu lớp học...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto my-12 bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-800 mb-2">Đã xảy ra lỗi</h3>
        <p className="text-red-600 mb-4">Không thể tải thông tin lớp học này.</p>
        <Link to="/teacher" className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition">
          <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại bảng điều khiển
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 mb-12">
      <ClassHeader 
        classDetails={classDetails} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <div className="mt-6" role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
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
}

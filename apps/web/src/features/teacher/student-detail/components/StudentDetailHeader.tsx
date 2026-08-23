import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { StudentInfo } from '../types';

interface StudentDetailHeaderProps {
  classId: string;
  studentInfo: StudentInfo | null;
  onExportClick?: () => void;
}

export const StudentDetailHeader: React.FC<StudentDetailHeaderProps> = ({ classId, studentInfo, onExportClick }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition duration-300 gap-4">
      <div className="flex items-center">
        <Link 
          to={`/teacher/classes/${classId}?tab=students`} 
          className="mr-5 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-4">
          {studentInfo ? (
            <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xl shadow-sm overflow-hidden">
              {studentInfo.avatar_url ? (
                <img 
                  src={studentInfo.avatar_url.startsWith('http') ? studentInfo.avatar_url : `${import.meta.env.VITE_API_URL}${studentInfo.avatar_url}`} 
                  alt={studentInfo.full_name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                studentInfo.full_name.charAt(0).toUpperCase()
              )}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 border border-gray-200 flex items-center justify-center font-bold text-xl shadow-sm">
              ?
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {studentInfo ? studentInfo.full_name : t('teacher.studentDetail.header.title')}
              </h1>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
                {t('teacher.studentDetail.header.badge')}
              </span>
            </div>
            {studentInfo?.email && (
              <p className="text-sm text-gray-500 mt-1">{studentInfo.email}</p>
            )}
          </div>
        </div>
      </div>

      {onExportClick && (
        <div className="self-end md:self-auto">
          <Button
            variant="outline"
            onClick={onExportClick}
            className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm px-4 py-2"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>{t('teacher.studentReport.exportBtn', 'Xuất Báo Cáo PDF')}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

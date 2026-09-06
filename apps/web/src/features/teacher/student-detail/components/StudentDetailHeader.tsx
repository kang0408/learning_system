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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
      <div className="flex items-center">
        <Link 
          to={`/teacher/classes/${classId}?tab=students`} 
          className="mr-4 p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/60 transition-all shadow-xs"
          aria-label={t('teacher.classDetail.back', 'Quay lại')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-4">
          {studentInfo ? (
            <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center font-bold text-xl shadow-xs overflow-hidden">
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
            <div className="w-13 h-13 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center font-bold text-xl shadow-xs">
              ?
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {studentInfo ? studentInfo.full_name : t('teacher.studentDetail.header.title')}
              </h1>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                {t('teacher.studentDetail.header.badge')}
              </span>
            </div>
            {studentInfo?.email && (
              <p className="text-sm text-slate-500 font-medium mt-0.5">{studentInfo.email}</p>
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

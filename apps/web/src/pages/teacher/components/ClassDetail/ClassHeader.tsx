import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart2, GraduationCap, BookOpen } from 'lucide-react';

interface ClassHeaderProps {
  classDetails: any;
  activeTab: 'analytics' | 'students' | 'assignments';
  onTabChange: (tab: 'analytics' | 'students' | 'assignments') => void;
}

export function ClassHeader({ classDetails, activeTab, onTabChange }: ClassHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition duration-300">
        <div className="flex items-center mb-4 md:mb-0">
          <Link to="/teacher" className="mr-5 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-slate-900 transition-colors" aria-label="Quay lại">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{classDetails?.name || 'Đang tải...'}</h1>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-900 text-xs font-semibold rounded-full border border-slate-200">
                {classDetails?.subject || 'Đang tải...'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <span>Mã tham gia lớp học:</span>
              <span className="font-bold text-slate-900 bg-slate-100/50 px-2 py-0.5 rounded border border-slate-200/50 select-all cursor-pointer">
                {classDetails?.join_code || '---'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div 
        className="flex border-b border-gray-200 bg-white p-2 rounded-xl shadow-sm border border-gray-100 gap-1.5"
        role="tablist"
        aria-label="Class Management Tabs"
      >
        {(['analytics', 'students', 'assignments'] as const).map(tab => {
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`${tab}-panel`}
              id={`${tab}-tab`}
              onClick={() => onTabChange(tab)}
              className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm transition-all duration-300 flex-1 md:flex-initial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-100'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab === 'analytics' && <BarChart2 className="w-4 h-4" aria-hidden="true" />}
              {tab === 'students' && <GraduationCap className="w-4 h-4" aria-hidden="true" />}
              {tab === 'assignments' && <BookOpen className="w-4 h-4" aria-hidden="true" />}
              {tab === 'analytics' ? 'Phân tích' : tab === 'students' ? 'Thành viên' : 'Bài tập'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

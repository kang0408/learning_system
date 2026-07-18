import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart2, GraduationCap, BookOpen, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface ClassHeaderProps {
  classDetails: any;
  activeTab: 'analytics' | 'students' | 'assignments';
  onTabChange: (tab: 'analytics' | 'students' | 'assignments') => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export function ClassHeader({ classDetails, activeTab, onTabChange, onEditClick, onDeleteClick }: ClassHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

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
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEditClick();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <Edit2 className="w-4 h-4" /> Chỉnh sửa
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteClick();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
                >
                  <Trash2 className="w-4 h-4" /> Xóa lớp học
                </button>
              </div>
            </>
          )}
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

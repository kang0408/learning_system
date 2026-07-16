import React from 'react';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  totalClasses: number;
  onCreateClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ totalClasses, onCreateClick }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition duration-300">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý Lớp học</h1>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 flex items-center gap-1">
            Tổng số: {totalClasses}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Theo dõi, tạo mới và quản lý tất cả các lớp học của bạn.</p>
      </div>
      <button
        onClick={onCreateClick}
        className="mt-4 md:mt-0 flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition duration-300 shadow-sm"
      >
        <Plus className="w-4 h-4 mr-2" /> Tạo lớp học
      </button>
    </div>
  );
};

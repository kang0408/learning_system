import React from 'react';
import { Plus, LayoutTemplate } from 'lucide-react';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateClick }) => {
  return (
    <div className="col-span-full text-center py-20 bg-white border border-gray-100 shadow-sm rounded-xl flex flex-col items-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
        <LayoutTemplate className="w-10 h-10 text-indigo-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có lớp học nào</h3>
      <p className="text-gray-500 mb-8 max-w-sm">Bạn chưa tạo hoặc chưa được gán phụ trách lớp học nào. Hãy tạo lớp học đầu tiên của bạn để bắt đầu giảng dạy.</p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition duration-300 shadow-sm"
      >
        <Plus className="w-5 h-5 mr-2" /> Tạo lớp học ngay
      </button>
    </div>
  );
};

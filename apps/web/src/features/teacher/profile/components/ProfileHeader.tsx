import React from 'react';
import { Award } from 'lucide-react';

export const ProfileHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition duration-300">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hồ sơ giáo viên</h1>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> Giáo viên
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin cá nhân và thông tin liên hệ của bạn.</p>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import type { TeacherClassItem } from '../types';

interface ClassCardProps {
  cls: TeacherClassItem;
}

export const ClassCard: React.FC<ClassCardProps> = ({ cls }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col shadow-sm hover:shadow-md hover:border-indigo-100 transition duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{cls.name}</h3>
        <span className="bg-slate-50 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 select-all cursor-pointer">
          Mã: {cls.join_code}
        </span>
      </div>
      
      <p className="text-gray-500 text-sm flex-1 mb-6 line-clamp-2">
        {cls.description || 'Không có mô tả'}
      </p>
      
      <div className="flex items-center text-sm font-medium text-gray-700 mb-6 bg-gray-50/80 rounded-lg p-2.5 border border-gray-100">
        <Users className="w-4 h-4 mr-2 text-indigo-500" />
        {cls._count?.members || 0} học sinh
      </div>
      
      <Link
        to={`/teacher/classes/${cls.id}`}
        className="mt-auto w-full inline-flex justify-center items-center px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:text-indigo-600 transition duration-200"
      >
        Xem chi tiết <ArrowRight className="w-4 h-4 ml-2" />
      </Link>
    </div>
  );
};

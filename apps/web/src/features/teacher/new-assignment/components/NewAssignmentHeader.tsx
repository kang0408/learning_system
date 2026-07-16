import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface NewAssignmentHeaderProps {
  classId: string;
}

export const NewAssignmentHeader: React.FC<NewAssignmentHeaderProps> = ({ classId }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition duration-300">
      <div className="flex items-center mb-4 md:mb-0">
        <button 
          onClick={() => navigate(`/teacher/classes/${classId}`)} 
          className="mr-5 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Giao bài tập mới</h1>
            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
              Tạo bài
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Thiết lập thông tin và danh sách câu hỏi cho bài tập.</p>
        </div>
      </div>
    </div>
  );
};

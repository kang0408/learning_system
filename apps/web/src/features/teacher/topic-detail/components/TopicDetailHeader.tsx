import React from 'react';
import { ArrowLeft, Edit, Trash2, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Topic } from '../types';

interface TopicDetailHeaderProps {
  topic: Topic;
  onOpenEditTopic: () => void;
  onOpenDeleteTopic: () => void;
  onOpenCreateQuestion: () => void;
  onOpenGenerateAi: () => void;
}

export const TopicDetailHeader: React.FC<TopicDetailHeaderProps> = ({
  topic,
  onOpenEditTopic,
  onOpenDeleteTopic,
  onOpenCreateQuestion,
  onOpenGenerateAi
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition duration-300">
      <div className="flex items-center mb-6 md:mb-0">
        <button 
          onClick={() => navigate('/teacher/questions')} 
          className="mr-5 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{topic?.name}</h1>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
              Chủ đề
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{topic?.description || 'Không có mô tả'}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
        <button
          onClick={onOpenGenerateAi}
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg border border-transparent hover:from-purple-700 hover:to-indigo-700 transition-colors text-sm shadow-sm"
        >
          <Sparkles className="w-4 h-4 mr-2" /> Tạo bằng AI
        </button>
        <button
          onClick={onOpenCreateQuestion}
          className="flex items-center justify-center px-4 py-2 bg-slate-900 text-white font-medium rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors text-sm shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm câu hỏi
        </button>
        <button
          onClick={onOpenEditTopic}
          className="flex items-center justify-center px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm shadow-sm"
        >
          <Edit className="w-4 h-4 mr-2" /> Sửa chủ đề
        </button>
        <button
          onClick={onOpenDeleteTopic}
          className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg border border-red-100 hover:bg-red-100 transition-colors text-sm shadow-sm"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Xóa
        </button>
      </div>
    </div>
  );
};

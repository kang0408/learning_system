import React from 'react';
import { Plus, Upload, Folder } from 'lucide-react';

interface QuestionBankHeaderProps {
  totalTopics: number;
  onOpenImport: () => void;
  onOpenCreateTopic: () => void;
  onOpenCreateQuestion: () => void;
}

export const QuestionBankHeader: React.FC<QuestionBankHeaderProps> = ({
  totalTopics,
  onOpenImport,
  onOpenCreateTopic,
  onOpenCreateQuestion
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition duration-300">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ngân hàng câu hỏi</h1>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
            {totalTopics} chủ đề
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Quản lý các chủ đề và danh sách câu hỏi trắc nghiệm, tự luận.</p>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
        <button
          onClick={onOpenImport}
          className="flex items-center justify-center px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm shadow-sm"
        >
          <Upload className="w-4 h-4 mr-2" /> Import CSV
        </button>
        <button
          onClick={onOpenCreateTopic}
          className="flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors text-sm shadow-sm"
        >
          <Folder className="w-4 h-4 mr-2" /> Tạo chủ đề
        </button>
        <button
          onClick={onOpenCreateQuestion}
          className="flex items-center justify-center px-4 py-2 bg-slate-900 text-white font-medium rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors text-sm shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Tạo câu hỏi
        </button>
      </div>
    </div>
  );
};

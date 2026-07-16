import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, Search, ChevronRight, FileQuestion } from 'lucide-react';
import type { Topic } from '../types';

interface TopicListProps {
  topics: Topic[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const TopicList: React.FC<TopicListProps> = ({ topics, searchTerm, onSearchChange }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex gap-4 items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm chủ đề..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {topics.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {topics.map(topic => (
              <li key={topic.id} className="hover:bg-gray-50 transition-colors group">
                <Link to={`/teacher/questions/topics/${topic.id}`} className="block p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center w-full">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 mr-5 group-hover:bg-indigo-100 transition-colors duration-200">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{topic.name}</h3>
                          {topic.code && (
                            <span className="ml-3 bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md border border-gray-200 text-xs font-medium">
                              MÃ: {topic.code}
                            </span>
                          )}
                        </div>
                        {topic.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{topic.description}</p>}
                        <div className="mt-2.5 flex items-center text-xs font-medium text-gray-500">
                          <span className="flex items-center text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                            {topic._count?.questions || 0} câu hỏi
                          </span>
                          <span className="mx-3 text-gray-300">•</span>
                          <span>Tạo ngày {new Date(topic.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : searchTerm ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full border border-gray-200 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Không tìm thấy chủ đề</h3>
            <p className="text-sm text-gray-500">Không có chủ đề nào khớp với từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full border border-indigo-100 flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Chưa có chủ đề nào</h3>
            <p className="text-sm text-gray-500">Hãy tạo một chủ đề mới để bắt đầu thêm câu hỏi.</p>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Folder, Search, ChevronRight, ChevronDown, FileQuestion } from 'lucide-react';
import type { Topic } from '../types';

interface TopicListProps {
  topics: Topic[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const TopicList: React.FC<TopicListProps> = ({ topics, searchTerm, onSearchChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (e: React.MouseEvent, topicId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const renderRow = (topic: Topic, depth: number) => {
    const hasChildren = topic.children && topic.children.length > 0;
    // Auto-expand if searching to show matches
    const isExpanded = searchTerm ? true : expandedNodes[topic.id];

    return (
      <React.Fragment key={topic.id}>
        <tr 
          className={`hover:bg-indigo-50/40 transition-colors border-b border-gray-100 group cursor-pointer ${depth === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
          onClick={() => navigate(`/teacher/questions/topics/${topic.id}`)}
        >
          <td className="p-4 align-top" style={{ paddingLeft: `${16 + depth * 32}px` }}>
            <div className="flex items-start gap-2.5">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(e, topic.id)}
                  className="p-1 mt-1 rounded hover:bg-gray-200 text-gray-500 transition-colors flex-shrink-0"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-6 flex-shrink-0" />
              )}
              <div className="flex items-start gap-3">
                <div className="p-2 mt-0.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 group-hover:bg-indigo-100 transition-colors flex-shrink-0">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {topic.name}
                    </span>
                    {topic.code && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">
                        {topic.code}
                      </span>
                    )}
                  </div>
                  {topic.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1 max-w-xl">{topic.description}</p>
                  )}
                </div>
              </div>
            </div>
          </td>
          <td className="p-4 align-top w-32">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100">
              <FileQuestion className="w-4 h-4" />
              {topic._count?.questions || 0}
            </span>
          </td>
          <td className="p-4 align-top text-sm text-gray-500 text-right w-32">
            {new Date(topic.created_at).toLocaleDateString()}
          </td>
        </tr>
        {hasChildren && isExpanded && topic.children!.map(child => renderRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex gap-4 items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('teacher.questionBank.topicList.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        {topics.length > 0 ? (
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-semibold">Cấu trúc Chủ đề</th>
                <th className="p-4 font-semibold">Số câu hỏi</th>
                <th className="p-4 font-semibold text-right">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {topics.map(t => renderRow(t, 0))}
            </tbody>
          </table>
        ) : searchTerm ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full border border-gray-200 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('teacher.questionBank.topicList.noTopicFound')}</h3>
            <p className="text-sm text-gray-500">{t('teacher.questionBank.topicList.noTopicFoundDesc')}</p>
          </div>
        ) : (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full border border-indigo-100 flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('teacher.questionBank.topicList.noTopic')}</h3>
            <p className="text-sm text-gray-500">{t('teacher.questionBank.topicList.noTopicDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

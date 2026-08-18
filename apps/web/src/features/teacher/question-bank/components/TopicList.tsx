import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Folder, Search, ChevronRight, ChevronDown, FileQuestion } from 'lucide-react';
import type { Topic } from '../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';

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
        <TableRow 
          className={`hover:bg-indigo-50/40 transition-colors border-b border-gray-100 group cursor-pointer ${depth === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
          onClick={() => navigate(`/teacher/questions/topics/${topic.id}`)}
        >
          <TableCell className="p-4 align-top" style={{ paddingLeft: `${16 + depth * 32}px` }}>
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
                      <Badge variant="secondary" size="sm">
                        {topic.code}
                      </Badge>
                    )}
                  </div>
                  {topic.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1 max-w-xl">{topic.description}</p>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell className="p-4 align-top w-32">
            <Badge variant="indigo" size="sm" className="gap-1.5 font-medium">
              <FileQuestion className="w-3.5 h-3.5" />
              {topic._count?.questions || 0}
            </Badge>
          </TableCell>
          <TableCell className="p-4 align-top text-sm text-gray-500 text-right w-32">
            {new Date(topic.created_at).toLocaleDateString()}
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && topic.children!.map(child => renderRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex gap-4 items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input 
            type="text" 
            placeholder={t('teacher.questionBank.topicList.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        {topics.length > 0 ? (
          <Table className="w-full min-w-[600px] text-left">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="p-4 font-semibold text-gray-500">Cấu trúc Chủ đề</TableHead>
                <TableHead className="p-4 font-semibold text-gray-500">Số câu hỏi</TableHead>
                <TableHead className="p-4 font-semibold text-gray-500 text-right">Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map(t => renderRow(t, 0))}
            </TableBody>
          </Table>
        ) : searchTerm ? (
          <EmptyState
            icon={<Search className="w-8 h-8 text-gray-400" />}
            title={t('teacher.questionBank.topicList.noTopicFound')}
            description={t('teacher.questionBank.topicList.noTopicFoundDesc')}
          />
        ) : (
          <EmptyState
            icon={<Folder className="w-8 h-8 text-indigo-500" />}
            title={t('teacher.questionBank.topicList.noTopic')}
            description={t('teacher.questionBank.topicList.noTopicDesc')}
          />
        )}
      </div>
    </div>
  );
};

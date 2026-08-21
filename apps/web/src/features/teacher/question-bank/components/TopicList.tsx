import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  Search,
  ChevronRight,
  ChevronDown,
  FileQuestion,
  Trash2,
  ArrowRight,
  X,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import type { Topic } from '../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select, type SelectOption } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { toast } from '@/utils/toast';
import { useDeleteTopic, useBatchDeleteTopics } from '../hooks/useTeacherQuestionBank';

interface TopicListProps {
  topics: Topic[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

type FilterQuestionStatus = 'all' | 'has_questions' | 'empty';
type SortOption = 'created_desc' | 'name_asc' | 'name_desc' | 'questions_desc';

export const TopicList: React.FC<TopicListProps> = ({ topics, searchTerm, onSearchChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const deleteTopicMutation = useDeleteTopic();
  const batchDeleteMutation = useBatchDeleteTopics();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterQuestionStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');

  // Deletion modals state
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Helper to collect all topic IDs from a tree
  const getAllTopicIds = (list: Topic[]): string[] => {
    let ids: string[] = [];
    for (const item of list) {
      ids.push(item.id);
      if (item.children && item.children.length > 0) {
        ids = ids.concat(getAllTopicIds(item.children));
      }
    }
    return ids;
  };

  // Helper to collect all node IDs for expanding
  const getAllNodeIdsMap = (list: Topic[], expand: boolean): Record<string, boolean> => {
    const map: Record<string, boolean> = {};
    const traverse = (items: Topic[]) => {
      for (const item of items) {
        map[item.id] = expand;
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    };
    traverse(list);
    return map;
  };

  const handleExpandAll = () => {
    setExpandedNodes(getAllNodeIdsMap(topics, true));
  };

  const handleCollapseAll = () => {
    setExpandedNodes(getAllNodeIdsMap(topics, false));
  };

  // Filter & Sort Options for Select component
  const filterOptions: SelectOption[] = useMemo(
    () => [
      { value: 'all', label: t('teacher.questionBank.topicList.filterAll') },
      { value: 'has_questions', label: t('teacher.questionBank.topicList.filterHasQuestions') },
      { value: 'empty', label: t('teacher.questionBank.topicList.filterEmpty') },
    ],
    [t]
  );

  const sortOptions: SelectOption[] = useMemo(
    () => [
      { value: 'created_desc', label: t('teacher.questionBank.topicList.sortCreatedDesc') },
      { value: 'name_asc', label: t('teacher.questionBank.topicList.sortNameAsc') },
      { value: 'name_desc', label: t('teacher.questionBank.topicList.sortNameDesc') },
      { value: 'questions_desc', label: t('teacher.questionBank.topicList.sortQuestionsDesc') },
    ],
    [t]
  );

  // Recursive filter & sort tree
  const processedTopics = useMemo(() => {
    const processList = (list: Topic[]): Topic[] => {
      return list
        .map((t) => {
          const children = t.children ? processList(t.children) : [];
          return { ...t, children };
        })
        .filter((t) => {
          if (filterStatus === 'has_questions') {
            const hasDirect = (t._count?.questions || 0) > 0;
            const hasChild = t.children && t.children.length > 0;
            return hasDirect || hasChild;
          }
          if (filterStatus === 'empty') {
            return (t._count?.questions || 0) === 0 && (!t.children || t.children.length === 0);
          }
          return true;
        })
        .sort((a, b) => {
          if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
          if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
          if (sortBy === 'questions_desc') return (b._count?.questions || 0) - (a._count?.questions || 0);
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    };

    return processList(topics);
  }, [topics, filterStatus, sortBy]);

  const allVisibleIds = useMemo(() => getAllTopicIds(processedTopics), [processedTopics]);

  // Master checkbox states
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedTopicIds.includes(id));
  const isSomeSelected = selectedTopicIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTopicIds([]);
    } else {
      setSelectedTopicIds(allVisibleIds);
    }
  };

  const handleToggleSelectOne = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const toggleExpand = (e: React.MouseEvent, topicId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  // Delete Handlers
  const handleSingleDelete = (topic: Topic, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTopicToDelete(topic);
  };

  const handleConfirmSingleDelete = async () => {
    if (!topicToDelete) return;
    try {
      await deleteTopicMutation.mutateAsync(topicToDelete.id);
      toast.success(t('teacher.questionBank.topicList.deleteTopicSuccess'));
      setSelectedTopicIds((prev) => prev.filter((id) => id !== topicToDelete.id));
      setTopicToDelete(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.questionBank.topicList.deleteTopicError'));
    }
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedTopicIds.length === 0) return;
    try {
      await batchDeleteMutation.mutateAsync(selectedTopicIds);
      toast.success(t('teacher.questionBank.topicList.batchDeleteSuccess', { count: selectedTopicIds.length }));
      setSelectedTopicIds([]);
      setShowBatchDeleteConfirm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.questionBank.topicList.batchDeleteError'));
    }
  };

  const renderRow = (topic: Topic, depth: number, parentPath?: string) => {
    const hasChildren = topic.children && topic.children.length > 0;
    const isExpanded = searchTerm ? true : expandedNodes[topic.id] ?? (depth < 1);
    const isSelected = selectedTopicIds.includes(topic.id);
    const currentPath = parentPath ? `${parentPath} › ${topic.name}` : topic.name;

    return (
      <React.Fragment key={topic.id}>
        <TableRow
          className={`hover:bg-indigo-50/40 transition-colors border-b border-gray-100 group cursor-pointer ${
            isSelected ? 'bg-indigo-50/60' : depth === 0 ? 'bg-white' : 'bg-slate-50/30'
          }`}
          onClick={() => navigate(`/teacher/questions/topics/${topic.id}`)}
        >
          {/* Checkbox Column */}
          <TableCell className="p-3 w-12 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onChange={() => handleToggleSelectOne(topic.id)}
              />
            </div>
          </TableCell>

          {/* Topic Structure Column */}
          <TableCell className="p-3.5 align-middle" style={{ paddingLeft: `${8 + depth * 28}px` }}>
            <div className="flex items-center gap-2.5">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(e, topic.id)}
                  className="p-1 rounded-md hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                  title={isExpanded ? t('teacher.questionBank.topicList.collapse') : t('teacher.questionBank.topicList.expand')}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-6 shrink-0" />
              )}

              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80 group-hover:bg-indigo-100 transition-colors shrink-0 shadow-xs">
                  <Folder className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm truncate">
                      {topic.name}
                    </span>
                    {topic.code && (
                      <Badge variant="secondary" size="sm" className="font-mono text-[11px] font-semibold">
                        {topic.code}
                      </Badge>
                    )}
                  </div>
                  {topic.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xl font-normal">
                      {topic.description}
                    </p>
                  )}
                  {searchTerm && parentPath && (
                    <span className="text-[11px] text-indigo-500/90 font-medium inline-block mt-0.5 truncate">
                      {parentPath}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </TableCell>

          {/* Question Count Badge */}
          <TableCell className="p-3.5 align-middle text-center w-36">
            <Badge
              variant={(topic._count?.questions || 0) > 0 ? 'indigo' : 'default'}
              size="sm"
              className="gap-1.5 font-semibold"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              {t('teacher.questionBank.topicList.questionCount', { count: topic._count?.questions || 0 })}
            </Badge>
          </TableCell>

          {/* Created Date */}
          <TableCell className="p-3.5 align-middle text-xs text-slate-500 text-center w-32 font-medium">
            {new Date(topic.created_at).toLocaleDateString('vi-VN')}
          </TableCell>

          {/* Direct Row Actions */}
          <TableCell className="p-3.5 align-middle text-right w-28" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={(e) => handleSingleDelete(topic, e)}
                title={t('teacher.questionBank.topicList.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                onClick={() => navigate(`/teacher/questions/topics/${topic.id}`)}
                title={t('teacher.questionBank.topicList.viewDetails')}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>

        {hasChildren && isExpanded && topic.children!.map((child) => renderRow(child, depth + 1, currentPath))}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-4">
      {/* Batch Actions Bar (Visible when items selected) */}
      {selectedTopicIds.length > 0 && (
        <div className="bg-indigo-900 text-white rounded-2xl p-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-indigo-900/15 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {selectedTopicIds.length}
            </span>
            <span className="font-semibold text-sm">
              {t('teacher.questionBank.topicList.selectedCount', { count: selectedTopicIds.length })}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTopicIds([])}
              className="text-white border-white/25 hover:bg-white/10 hover:text-white bg-transparent"
            >
              {t('teacher.questionBank.topicList.clearSelection')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="bg-red-500 hover:bg-red-600 text-white border-transparent shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {t('teacher.questionBank.topicList.batchDeleteBtn', { count: selectedTopicIds.length })}
            </Button>
          </div>
        </div>
      )}

      {/* Main List Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar: Search, Filters, Sort & Expand/Collapse */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col lg:flex-row gap-3.5 justify-between items-stretch lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('teacher.questionBank.topicList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                title={t('teacher.questionBank.topicList.clearKeyword')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter & Sort Controls using Select component */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Status Filter */}
            <div className="w-44 sm:w-48">
              <Select
                value={filterStatus}
                onChange={(val) => setFilterStatus(val as FilterQuestionStatus)}
                options={filterOptions}
                size="sm"
              />
            </div>

            {/* Sort Selector */}
            <div className="w-44 sm:w-48">
              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val as SortOption)}
                options={sortOptions}
                size="sm"
              />
            </div>

            {/* Expand / Collapse All */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpandAll}
                className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                title={t('teacher.questionBank.topicList.expandAll')}
              >
                <ChevronsUpDown className="w-3.5 h-3.5 mr-1" />
                {t('teacher.questionBank.topicList.expandAll')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseAll}
                className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                title={t('teacher.questionBank.topicList.collapseAll')}
              >
                <ChevronsDownUp className="w-3.5 h-3.5 mr-1" />
                {t('teacher.questionBank.topicList.collapseAll')}
              </Button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          {processedTopics.length > 0 ? (
            <Table className="w-full min-w-[700px] text-left">
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200/80 text-xs uppercase tracking-wider text-slate-500">
                  {/* Master Checkbox */}
                  <TableHead className="p-3 w-12 text-center">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isSomeSelected}
                        onChange={handleToggleSelectAll}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="p-3.5 font-bold text-slate-700">
                    {t('teacher.questionBank.topicList.topicStructure')}
                  </TableHead>
                  <TableHead className="p-3.5 font-bold text-slate-700 text-center w-36">
                    {t('teacher.questionBank.topicList.questionsCol')}
                  </TableHead>
                  <TableHead className="p-3.5 font-bold text-slate-700 text-center w-32">
                    {t('teacher.questionBank.topicList.createdAtCol')}
                  </TableHead>
                  <TableHead className="p-3.5 font-bold text-slate-700 text-right w-28">
                    {t('teacher.questionBank.topicList.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{processedTopics.map((t) => renderRow(t, 0))}</TableBody>
            </Table>
          ) : searchTerm || filterStatus !== 'all' ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {t('teacher.questionBank.topicList.noTopicFound')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-4">
                {t('teacher.questionBank.topicList.noTopicFoundDesc')}
              </p>
              <div className="flex items-center justify-center gap-2">
                {searchTerm && (
                  <Button variant="outline" size="sm" onClick={() => onSearchChange('')}>
                    {t('teacher.questionBank.topicList.clearKeyword')}
                  </Button>
                )}
                {filterStatus !== 'all' && (
                  <Button variant="outline" size="sm" onClick={() => setFilterStatus('all')}>
                    {t('teacher.questionBank.topicList.resetFilter')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Folder className="w-8 h-8 text-indigo-500" />}
              title={t('teacher.questionBank.topicList.noTopic')}
              description={t('teacher.questionBank.topicList.noTopicDesc')}
            />
          )}
        </div>
      </div>

      {/* Single Topic Delete Modal */}
      <ConfirmDialog
        isOpen={!!topicToDelete}
        onClose={() => setTopicToDelete(null)}
        onConfirm={handleConfirmSingleDelete}
        title={t('teacher.questionBank.topicList.deleteTopicTitle')}
        description={t('teacher.questionBank.topicList.deleteTopicDesc', { name: topicToDelete?.name })}
        confirmText={t('teacher.questionBank.topicList.deleteTopicConfirm')}
        isDanger={true}
        isLoading={deleteTopicMutation.isPending}
      />

      {/* Batch Topics Delete Modal */}
      <ConfirmDialog
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleConfirmBatchDelete}
        title={t('teacher.questionBank.topicList.batchDeleteTitle')}
        description={t('teacher.questionBank.topicList.batchDeleteDesc', { count: selectedTopicIds.length })}
        confirmText={t('teacher.questionBank.topicList.batchDeleteConfirm', { count: selectedTopicIds.length })}
        isDanger={true}
        isLoading={batchDeleteMutation.isPending}
      />
    </div>
  );
};


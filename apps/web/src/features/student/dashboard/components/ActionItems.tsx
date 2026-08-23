import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Assignment, DailyScheduleClass, HierarchicalTopicNode } from '../types';

interface ActionItemsProps {
  assignments: Assignment[];
  dailySchedule: DailyScheduleClass[];
  topicsTree?: HierarchicalTopicNode[];
  selectedTopicFilter?: string | null;
  onClearTopicFilter?: () => void;
}

type TabType = 'all' | 'by_class' | 'by_topic' | 'overdue' | 'completed';

export const ActionItems: React.FC<ActionItemsProps> = ({ 
  assignments, 
  dailySchedule,
  topicsTree = [],
  selectedTopicFilter,
  onClearTopicFilter
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Helper for recursive topic descendant collection
  const getAllDescendantTopicNames = (tree: HierarchicalTopicNode[], targetName: string): Set<string> => {
    const result = new Set<string>();
    result.add(targetName.toLowerCase());

    const findAndCollect = (nodes: HierarchicalTopicNode[], isAncestorMatched: boolean) => {
      for (const node of nodes) {
        const isTarget = isAncestorMatched || node.name.toLowerCase() === targetName.toLowerCase();
        if (isTarget) {
          result.add(node.name.toLowerCase());
        }
        if (node.children && node.children.length > 0) {
          findAndCollect(node.children, isTarget);
        }
      }
    };

    findAndCollect(tree, false);
    return result;
  };

  // Helper for accent-insensitive search
  const normalizeText = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .trim();
  };

  // Filter daily schedule based on search
  const filteredDailySchedule = useMemo(() => {
    if (!dailySchedule || dailySchedule.length === 0) return [];
    if (!searchQuery.trim()) return dailySchedule;

    const normQ = normalizeText(searchQuery);
    return dailySchedule
      .map(cls => ({
        ...cls,
        assignments: cls.assignments.filter(ass => 
          normalizeText(ass.title).includes(normQ) || normalizeText(cls.class_name).includes(normQ)
        )
      }))
      .filter(cls => cls.assignments.length > 0);
  }, [dailySchedule, searchQuery]);

  // Filter assignments based on search, recursive topic filter, and tab
  const filteredAssignments = useMemo(() => {
    let list = assignments.filter(a => {
      // Exclude assignments already in SM2 daily schedule
      for (const cls of dailySchedule) {
        if (cls.assignments.some(ass => ass.assignment_id === a.id)) return false;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const normQ = normalizeText(searchQuery);
      list = list.filter(a => 
        normalizeText(a.title).includes(normQ) || 
        (a.class?.name && normalizeText(a.class.name).includes(normQ))
      );
    }

    if (selectedTopicFilter) {
      const allowedTopics = getAllDescendantTopicNames(topicsTree, selectedTopicFilter);
      list = list.filter(a => 
        a.assignment_questions?.some(aq => {
          const tName = aq.question.topic?.name?.toLowerCase() || '';
          return allowedTopics.has(tName) || 
                 tName.includes(selectedTopicFilter.toLowerCase()) || 
                 aq.question.topic_id === selectedTopicFilter;
        })
      );
    }

    if (activeTab === 'overdue') {
      const now = new Date();
      list = list.filter(a => {
        const isOverdue = a.deadline ? new Date(a.deadline) < now : false;
        const isCompleted = (a.quiz_sessions?.filter(s => s.status === 'completed') || []).length > 0;
        return isOverdue && !isCompleted;
      });
    } else if (activeTab === 'completed') {
      list = list.filter(a => {
        const completedSessions = a.quiz_sessions?.filter(s => s.status === 'completed') || [];
        return completedSessions.length > 0;
      });
    }

    return list;
  }, [assignments, dailySchedule, topicsTree, searchQuery, selectedTopicFilter, activeTab]);

  // Group by class
  const groupedByClass = useMemo(() => {
    const map = new Map<string, { className: string; subject?: string; items: Assignment[] }>();
    for (const a of filteredAssignments) {
      const classId = a.class?.id || a.class_id || 'general';
      const className = a.class?.name || t('student.dashboard.generalAssignments', 'GENERAL ASSIGNMENTS');
      if (!map.has(classId)) {
        map.set(classId, { className, subject: a.class?.subject, items: [] });
      }
      map.get(classId)!.items.push(a);
    }
    return Array.from(map.entries()).map(([classId, data]) => ({ classId, ...data }));
  }, [filteredAssignments, t]);

  // Group by topic
  const groupedByTopic = useMemo(() => {
    const map = new Map<string, { topicName: string; items: Assignment[] }>();
    for (const a of filteredAssignments) {
      const firstTopic = a.assignment_questions?.[0]?.question?.topic?.name || t('student.dashboard.generalTopic', 'GENERAL TOPIC');
      if (!map.has(firstTopic)) {
        map.set(firstTopic, { topicName: firstTopic, items: [] });
      }
      map.get(firstTopic)!.items.push(a);
    }
    return Array.from(map.values());
  }, [filteredAssignments, t]);

  const renderAssignmentCard = (assignment: Assignment) => {
    const isOverdue = assignment.deadline ? new Date(assignment.deadline) < new Date() : false;
    const completedSessions = assignment.quiz_sessions?.filter(s => s.status === 'completed') || [];
    const attemptsCount = completedSessions.length;
    const maxAttempts = assignment.max_attempts || 0;
    const isLocked = maxAttempts > 0 && attemptsCount >= maxAttempts;
    const bestScore = completedSessions.reduce((max, s) => Math.max(max, Number(s.score || 0)), 0);

    return (
      <div 
        key={`ass-${assignment.id}`} 
        className={`border-2 border-zinc-900 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
          isLocked 
            ? 'opacity-60 bg-zinc-100' 
            : isOverdue && attemptsCount === 0
            ? 'bg-red-50 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#dc2626] border-red-600'
            : 'hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#4f46e5] bg-white'
        }`}
      >
        <div className="space-y-1 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-widest text-zinc-500">
              {assignment.class?.name || t('student.dashboard.course', 'COURSE')}
            </span>
            {isOverdue && attemptsCount === 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 tracking-widest uppercase">
                {t('student.dashboard.overdue', 'OVERDUE')}
              </span>
            )}
            {attemptsCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 tracking-widest uppercase">
                {t('student.dashboard.score', 'SCORE')}: {bestScore}%
              </span>
            )}
          </div>
          <h4 className="text-xl font-black tracking-tighter uppercase leading-snug">
            {assignment.title}
          </h4>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {assignment.deadline 
              ? `${t('student.dashboard.deadline')}: ${new Date(assignment.deadline).toLocaleDateString()}` 
              : t('student.dashboard.noDeadline')}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {isLocked ? (
            <span className="font-bold border-2 border-zinc-900 px-4 py-2 w-full md:w-auto text-center text-xs uppercase tracking-widest bg-zinc-200">
              {t('student.dashboard.submitted', 'SUBMITTED')}
            </span>
          ) : (
            <Link
              to={`/quiz?assignment=${assignment.id}`}
              className="font-bold bg-zinc-900 text-white border-2 border-zinc-900 px-5 py-2 w-full md:w-auto text-center hover:bg-indigo-600 hover:border-indigo-600 transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-1"
            >
              <span>{attemptsCount > 0 ? t('student.dashboard.retry') : t('student.dashboard.start')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="lg:col-span-7 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b-2 border-zinc-900 pb-3 gap-4">
        <div>
          <span className="font-bold text-xs uppercase tracking-widest text-zinc-500">
            {t('student.dashboard.taskList', 'TASK OVERVIEW')}
          </span>
          <h2 className="text-3xl font-black tracking-tighter uppercase">
            {t('student.dashboard.actionItems', 'ASSIGNMENT CATALOG')}
          </h2>
        </div>
        <Link 
          to="/student/classes" 
          className="font-bold text-xs uppercase tracking-widest text-indigo-600 hover:underline flex items-center gap-1 border-b-2 border-indigo-600 pb-0.5 self-start sm:self-auto"
        >
          <span>{t('student.dashboard.allClasses')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs & Search Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'by_class', 'by_topic', 'overdue', 'completed'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            const labels: Record<TabType, string> = {
              all: t('student.dashboard.tabAll', 'ALL'),
              by_class: t('student.dashboard.tabByClass', 'BY CLASS'),
              by_topic: t('student.dashboard.tabByTopic', 'BY TOPIC'),
              overdue: t('student.dashboard.tabOverdue', 'OVERDUE'),
              completed: t('student.dashboard.tabCompleted', 'COMPLETED')
            };

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-black text-xs uppercase tracking-widest px-4 py-2 border-2 border-zinc-900 transition-all ${
                  isActive 
                    ? 'bg-zinc-900 text-white shadow-[2px_2px_0_0_#4f46e5]' 
                    : 'bg-white text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Search input & Active topic tag */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('student.dashboard.searchPlaceholder', 'SEARCH ASSIGNMENT OR CLASS...')}
              className="w-full pl-9 pr-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {selectedTopicFilter && (
            <div className="flex items-center gap-2 bg-indigo-50 border-2 border-indigo-600 px-3 py-1.5 self-start sm:self-auto">
              <span className="font-bold text-xs uppercase tracking-wider text-indigo-900">
                {t('student.dashboard.topicPrefix', 'TOPIC')}: {selectedTopicFilter}
              </span>
              {onClearTopicFilter && (
                <button 
                  onClick={onClearTopicFilter} 
                  className="text-indigo-900 hover:text-red-600"
                  title={t('student.dashboard.clickToFilter', 'Clear Filter')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main List Rendering */}
      <div className="space-y-6">
        {/* Daily Schedule (SM-2 Spaced Repetition) */}
        {activeTab === 'all' && filteredDailySchedule.length > 0 && (
          <div className="space-y-4">
            <div className="border-b-2 border-zinc-900 pb-1">
              <span className="font-black text-sm uppercase tracking-widest text-indigo-600">
                {t('student.dashboard.sm2Section', 'HÀNG ĐỢI ÔN TẬP TRÍ NHỚ')}
              </span>
            </div>
            {filteredDailySchedule.map((cls, idx) => (
              <div key={`sm2-${idx}`} className="border-2 border-zinc-900 p-5 bg-indigo-50 hover:border-indigo-600 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-black tracking-tighter uppercase">{cls.class_name}</h4>
                  <span className="font-bold text-xs uppercase tracking-widest border-2 border-zinc-900 bg-white px-2 py-1">
                    {cls.total_due} {t('student.dashboard.dueLabel')}
                  </span>
                </div>
                <div className="space-y-3">
                  {cls.assignments.map((ass) => (
                    <Link
                      key={ass.assignment_id}
                      to={ass.assignment_id !== 'general' ? `/quiz?assignment=${ass.assignment_id}` : '#'}
                      className="flex justify-between items-center bg-white border-2 border-zinc-900 p-3 font-bold text-sm hover:bg-zinc-900 hover:text-white transition-colors"
                    >
                      <span className="uppercase tracking-tight">{ass.title}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content by Tab */}
        {filteredAssignments.length === 0 && (activeTab !== 'all' || filteredDailySchedule.length === 0) ? (
          <div className="p-10 border-2 border-dashed border-zinc-300 text-center space-y-4 bg-zinc-50">
            <p className="font-bold text-zinc-500 uppercase tracking-widest text-sm">
              {selectedTopicFilter 
                ? t('student.dashboard.noAssignmentForTopic', { topic: selectedTopicFilter, defaultValue: `CHỦ ĐỀ "${selectedTopicFilter}" HIỆN CHƯA CÓ BÀI TẬP LỚP NÀO ĐƯỢC GIAO` })
                : t('student.dashboard.noPendingTasks', 'KHÔNG CÓ BÀI TẬP PHÙ HỢP')}
            </p>
            {selectedTopicFilter && (
              <div>
                <Link
                  to="/quiz"
                  className="inline-flex items-center gap-1.5 font-black text-xs uppercase tracking-widest bg-zinc-900 text-white px-4 py-2 hover:bg-indigo-600 transition-colors border-2 border-zinc-900"
                >
                  <span>{t('student.dashboard.practiceTopic', 'LUYỆN TẬP TỰ DO CHO CHỦ ĐỀ NÀY')}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        ) : activeTab === 'by_class' ? (
          /* Grouped by Class Accordions */
          <div className="space-y-4">
            {groupedByClass.map(group => {
              const isCollapsed = collapsedGroups[`class-${group.classId}`];
              return (
                <div key={`group-class-${group.classId}`} className="border-2 border-zinc-900 bg-white">
                  <button
                    onClick={() => toggleGroup(`class-${group.classId}`)}
                    className="w-full p-4 flex justify-between items-center bg-zinc-100 hover:bg-zinc-200 border-b-2 border-zinc-900 text-left transition-colors"
                  >
                    <div>
                      <span className="font-black text-lg tracking-tighter uppercase">
                        {group.className}
                      </span>
                      <span className="ml-3 font-bold text-xs text-zinc-500 uppercase tracking-widest">
                        ({group.items.length} {t('student.dashboard.items', 'ASSIGNMENTS')})
                      </span>
                    </div>
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                  {!isCollapsed && (
                    <div className="p-4 space-y-3">
                      {group.items.map(renderAssignmentCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : activeTab === 'by_topic' ? (
          /* Grouped by Topic Accordions */
          <div className="space-y-4">
            {groupedByTopic.map(group => {
              const isCollapsed = collapsedGroups[`topic-${group.topicName}`];
              return (
                <div key={`group-topic-${group.topicName}`} className="border-2 border-zinc-900 bg-white">
                  <button
                    onClick={() => toggleGroup(`topic-${group.topicName}`)}
                    className="w-full p-4 flex justify-between items-center bg-zinc-100 hover:bg-zinc-200 border-b-2 border-zinc-900 text-left transition-colors"
                  >
                    <div>
                      <span className="font-black text-lg tracking-tighter uppercase">
                        {group.topicName}
                      </span>
                      <span className="ml-3 font-bold text-xs text-zinc-500 uppercase tracking-widest">
                        ({group.items.length} {t('student.dashboard.items', 'ASSIGNMENTS')})
                      </span>
                    </div>
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                  {!isCollapsed && (
                    <div className="p-4 space-y-3">
                      {group.items.map(renderAssignmentCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat list for 'all', 'overdue', 'completed' */
          <div className="space-y-3">
            {filteredAssignments.map(renderAssignmentCard)}
          </div>
        )}
      </div>
    </section>
  );
};


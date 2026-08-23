import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Search, X, Filter } from 'lucide-react';
import type { AssignmentItem } from '../types';

interface ClassAssignmentsProps {
  assignments: AssignmentItem[];
}

export const ClassAssignments: React.FC<ClassAssignmentsProps> = ({ assignments }) => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'curriculum_asc' | 'deadline_asc' | 'score_desc' | 'created_desc'>('curriculum_asc');

  // Filter and sort assignments
  const filteredAssignments = useMemo(() => {
    let list = assignments || [];

    // 1. Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((a) => {
        const titleMatch = a.title?.toLowerCase().includes(term);
        const descMatch = a.description?.toLowerCase().includes(term);
        const curriculumMatch = a.curriculum_assignments?.some(ca => ca.curriculum?.title?.toLowerCase().includes(term));
        return titleMatch || descMatch || curriculumMatch;
      });
    }

    // 2. Status filter
    if (statusFilter !== 'all') {
      list = list.filter((a) => {
        const sessions = a.quiz_sessions || [];
        const completedSessions = sessions.filter(s => s.status === 'completed');
        const isCompleted = completedSessions.length > 0;
        const isOverdue = a.deadline ? new Date(a.deadline) < new Date() && !isCompleted : false;

        if (statusFilter === 'completed') return isCompleted;
        if (statusFilter === 'overdue') return isOverdue;
        if (statusFilter === 'pending') return !isCompleted && !isOverdue;
        return true;
      });
    }

    // 3. Sorting
    return [...list].sort((a, b) => {
      const sessionsA = a.quiz_sessions?.filter(s => s.status === 'completed') || [];
      const sessionsB = b.quiz_sessions?.filter(s => s.status === 'completed') || [];
      const bestScoreA = sessionsA.length > 0 ? Math.max(...sessionsA.map(s => s.score)) : -1;
      const bestScoreB = sessionsB.length > 0 ? Math.max(...sessionsB.map(s => s.score)) : -1;

      if (sortBy === 'score_desc') {
        return bestScoreB - bestScoreA;
      }

      if (sortBy === 'deadline_asc') {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }

      if (sortBy === 'created_desc') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }

      // Default: 'curriculum_asc' (theo lộ trình học)
      const aOrder = a.curriculum_assignments?.[0]?.curriculum?.order_index ?? a.curriculum_assignments?.[0]?.order_index;
      const bOrder = b.curriculum_assignments?.[0]?.curriculum?.order_index ?? b.curriculum_assignments?.[0]?.order_index;

      if (aOrder !== undefined && bOrder !== undefined) {
        return aOrder - bOrder;
      }
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;

      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [assignments, searchTerm, statusFilter, sortBy]);

  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all' || sortBy !== 'curriculum_asc';

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('curriculum_asc');
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase text-zinc-900">
          {t('student.classDetail.assignments', { count: assignments.length })}
        </h2>
        <div className="font-mono font-bold text-xs uppercase px-3 py-1.5 border-2 border-zinc-900 bg-indigo-50 text-indigo-900 w-fit">
          {t('student.classDetail.showingCount', { count: filteredAssignments.length, total: assignments.length })}
        </div>
      </div>

      {/* Search & Filter Toolbar (Visible when there are assignments) */}
      {assignments.length > 0 && (
        <div className="border-4 border-zinc-900 bg-white p-5 shadow-[6px_6px_0_0_#18181b] space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('student.classDetail.searchAssignmentsPlaceholder', 'TÌM KIẾM BÀI TẬP HOẶC BÀI HỌC...')}
                className="w-full pl-10 pr-9 py-2.5 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-[2px_2px_0_0_#18181b]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-[2px_2px_0_0_#18181b] cursor-pointer"
              >
                <option value="curriculum_asc">{t('student.classDetail.sortCurriculum', 'THEO LỘ TRÌNH')}</option>
                <option value="deadline_asc">{t('student.classDetail.sortDeadlineAsc', 'HẠN NỘP GẦN NHẤT')}</option>
                <option value="score_desc">{t('student.classDetail.sortScoreDesc', 'ĐIỂM CAO NHẤT')}</option>
                <option value="created_desc">{t('student.classDetail.sortCreatedDesc', 'MỚI NHẤT')}</option>
              </select>
            </div>
          </div>

          {/* Status Filter Pills & Clear button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t-2 border-zinc-100">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: t('student.classDetail.filterAll', 'TẤT CẢ') },
                { id: 'pending', label: t('student.classDetail.filterPending', 'CHƯA HOÀN THÀNH') },
                { id: 'completed', label: t('student.classDetail.filterCompleted', 'ĐÃ HOÀN THÀNH') },
                { id: 'overdue', label: t('student.classDetail.filterOverdue', 'QUÁ HẠN') },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-zinc-900 transition-all ${
                    statusFilter === f.id
                      ? 'bg-zinc-900 text-white shadow-[2px_2px_0_0_#4f46e5]'
                      : 'bg-white text-zinc-800 hover:bg-zinc-100 shadow-[2px_2px_0_0_#18181b]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700 underline px-2 py-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('student.classDetail.clearFilters', 'XÓA BỘ LỌC')}</span>
              </button>
            )}
          </div>
        </div>
      )}
      
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredAssignments.map(assignment => {
            const isOverdue = assignment.deadline ? new Date(assignment.deadline) < new Date() : false;
            const sessions = assignment.quiz_sessions || [];
            const completedSessions = sessions.filter(s => s.status === 'completed');
            const bestScore = completedSessions.length > 0 
              ? Math.max(...completedSessions.map(s => s.score)) 
              : null;
            const attemptsCount = completedSessions.length;
            const maxAttempts = assignment.max_attempts || 0;
            const isLocked = maxAttempts > 0 && attemptsCount >= maxAttempts;
            const curriculumInfo = assignment.curriculum_assignments?.[0]?.curriculum;
            
            return (
              <div 
                key={assignment.id} 
                className={`border-2 border-zinc-900 p-6 md:p-8 flex flex-col lg:flex-row justify-between gap-8 transition-all ${
                  isLocked 
                    ? 'bg-zinc-100 opacity-60' 
                    : 'hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#4f46e5] hover:border-indigo-600 bg-white group'
                }`}
              >
                <div className="flex-1">
                  {curriculumInfo && (
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold uppercase tracking-wider text-xs">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Bài {curriculumInfo.order_index}: {curriculumInfo.title}</span>
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <h4 className="text-3xl font-black tracking-tighter uppercase group-hover:text-indigo-600 transition-colors">
                      {assignment.title}
                    </h4>
                    {isOverdue && (
                      <span className="bg-red-600 text-white font-bold uppercase tracking-widest text-xs px-2 py-1">
                        {t('student.classDetail.overdue')}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-medium text-zinc-600 mb-6">
                    {assignment.description || t('student.classDetail.noDescription')}
                  </p>
                  <div className="font-mono font-bold text-sm bg-indigo-50 text-indigo-900 inline-block px-3 py-1 border border-indigo-200">
                    {assignment.deadline 
                      ? t('student.classDetail.due', { 
                          date: new Date(assignment.deadline).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US') 
                        }) 
                      : t('student.classDetail.noDeadline')}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end mr-4">
                    {bestScore !== null && (
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
                          {t('student.classDetail.bestScore')}
                        </p>
                        <Link 
                          to={`/session-result?id=${completedSessions[0].id}`} 
                          className="text-4xl font-black hover:underline text-indigo-600"
                        >
                          {bestScore.toFixed(0)}
                        </Link>
                      </div>
                    )}
                    {maxAttempts > 0 && (
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">
                        {t('student.classDetail.attempts', { count: attemptsCount, max: maxAttempts })}
                      </p>
                    )}
                  </div>

                  {isLocked ? (
                    <span className="font-bold border-2 border-zinc-900 px-6 py-4 uppercase tracking-widest text-center">
                      {t('student.classDetail.completed')}
                    </span>
                  ) : (
                    <Link 
                      to={`/quiz?assignment=${assignment.id}`} 
                      className="font-bold bg-indigo-600 text-white border-2 border-indigo-600 px-8 py-4 text-center hover:bg-zinc-900 hover:border-zinc-900 transition-colors uppercase tracking-widest"
                    >
                      {bestScore !== null ? t('student.classDetail.retry') : t('student.classDetail.begin')}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : assignments.length > 0 ? (
        <div className="border-4 border-zinc-900 bg-white p-12 text-center shadow-[6px_6px_0_0_#18181b]">
          <div className="w-16 h-16 border-2 border-zinc-900 bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_0_#18181b]">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mb-2">
            {t('student.classDetail.noFilterResults', 'Không tìm thấy bài tập nào')}
          </h3>
          <p className="text-zinc-600 font-medium max-w-md mx-auto mb-6">
            {t('student.classDetail.noFilterResultsDesc', 'Không có bài tập nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.')}
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-6 py-3 bg-zinc-900 text-white font-black uppercase tracking-widest border-2 border-zinc-900 hover:bg-indigo-600 transition-colors shadow-[4px_4px_0_0_#18181b]"
          >
            {t('student.classDetail.clearFilters', 'Xóa bộ lọc')}
          </button>
        </div>
      ) : (
        <div className="py-24 border-2 border-dashed border-zinc-400 text-center">
          <p className="text-3xl font-black uppercase tracking-tighter text-zinc-400">
            {t('student.classDetail.noAssignments')}
          </p>
        </div>
      )}
    </div>
  );
};

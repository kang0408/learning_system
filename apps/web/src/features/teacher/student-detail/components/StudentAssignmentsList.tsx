import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, CheckCircle, Clock, Target, CalendarDays, Search, X, Filter } from 'lucide-react';
import type { StudentAssignment } from '../types';
import { SessionResultModal } from './SessionResultModal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface StudentAssignmentsListProps {
  assignments: StudentAssignment[];
}

export const StudentAssignmentsList: React.FC<StudentAssignmentsListProps> = ({ assignments }) => {
  const { t } = useTranslation();
  const publishedAssignments = useMemo(() => assignments.filter((a) => a.is_published), [assignments]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  const statusOptions = [
    { label: t('teacher.studentDetail.assignments.filterStatusAll', 'Tất cả trạng thái'), value: 'all' },
    { label: t('teacher.studentDetail.assignments.statusCompleted', 'Hoàn thành').split('(')[0].trim(), value: 'completed' },
    { label: t('teacher.studentDetail.assignments.statusInProgress', 'Đang làm'), value: 'in_progress' },
    { label: t('teacher.studentDetail.assignments.statusOverdue', 'Quá hạn'), value: 'overdue' },
    { label: t('teacher.studentDetail.assignments.statusPending', 'Chưa làm'), value: 'pending' },
  ];

  const scopeOptions = [
    { label: t('teacher.studentDetail.assignments.filterScopeAll', 'Tất cả đối tượng'), value: 'all' },
    { label: t('teacher.studentDetail.assignments.filterScopeAllStudents', 'Giao cả lớp'), value: 'all_students' },
    { label: t('teacher.studentDetail.assignments.filterScopeSpecific', 'Giao cá nhân'), value: 'specific' },
  ];

  const filteredAssignments = useMemo(() => {
    let list = publishedAssignments;

    // 1. Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((a) => {
        const titleMatch = a.title?.toLowerCase().includes(term);
        const descMatch = (a as any).description?.toLowerCase().includes(term);
        return titleMatch || descMatch;
      });
    }

    // 2. Status filter
    if (statusFilter !== 'all') {
      list = list.filter((a) => {
        const isOverdue = a.student_status === 'pending' && a.deadline && new Date(a.deadline) < new Date();
        if (statusFilter === 'completed') return a.student_status === 'completed';
        if (statusFilter === 'in_progress') return a.student_status === 'in_progress';
        if (statusFilter === 'overdue') return isOverdue;
        if (statusFilter === 'pending') return a.student_status === 'pending' && !isOverdue;
        return true;
      });
    }

    // 3. Scope filter
    if (scopeFilter !== 'all') {
      list = list.filter((a) => {
        if (scopeFilter === 'all_students') return a.is_all_students;
        if (scopeFilter === 'specific') return !a.is_all_students;
        return true;
      });
    }

    return list;
  }, [publishedAssignments, searchTerm, statusFilter, scopeFilter]);

  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all' || scopeFilter !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setScopeFilter('all');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-500" /> {t('teacher.studentDetail.assignments.title')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('teacher.studentDetail.assignments.total', { count: publishedAssignments.length })}
          </p>
        </div>
      </div>

      {publishedAssignments.length > 0 ? (
        <>
          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-gray-100 bg-white space-y-3">
            {/* Row 1: Search Bar (Full Width) */}
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={t('teacher.studentDetail.assignments.searchPlaceholder', 'Tìm kiếm bài tập...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Row 2: Filter Selects (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Status filter */}
              <div className="w-full">
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                  size="sm"
                />
              </div>

              {/* Scope filter */}
              <div className="w-full">
                <Select
                  value={scopeFilter}
                  onChange={setScopeFilter}
                  options={scopeOptions}
                  size="sm"
                />
              </div>
            </div>

            {/* Row 3: Result Count & Clear Filters */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="font-semibold text-slate-500">
                {t('teacher.studentDetail.assignments.showingCount', {
                  count: filteredAssignments.length,
                  total: publishedAssignments.length,
                  defaultValue: `Hiển thị ${filteredAssignments.length} / ${publishedAssignments.length} bài tập`,
                })}
              </span>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  {t('teacher.studentDetail.assignments.clearFilters', 'Xóa bộ lọc')}
                </Button>
              )}
            </div>
          </div>

          {/* List or Filtered Empty State */}
          <div className="flex-1 overflow-y-auto max-h-[600px] lg:max-h-[calc(100vh-200px)]">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Filter className="w-6 h-6" />
                </div>
                <p className="text-gray-900 font-bold text-base">
                  {t('teacher.studentDetail.assignments.noFilterResults', 'Không tìm thấy bài tập nào')}
                </p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto mb-4">
                  {t('teacher.studentDetail.assignments.noFilterResultsDesc', 'Không có bài tập nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.')}
                </p>
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  {t('teacher.studentDetail.assignments.clearFilters', 'Xóa bộ lọc')}
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredAssignments.map((a) => {
                  const isOverdue = a.student_status === 'pending' && a.deadline && new Date(a.deadline) < new Date();
                  const isClickable = a.student_status === 'completed' && a.session_id;

                  return (
                    <li
                      key={a.id}
                      className={`p-5 hover:bg-gray-50/80 transition-colors duration-200 ${isClickable ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (isClickable) {
                          setSelectedSessionId(a.session_id!);
                        }
                      }}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-4">
                          <p className="font-semibold text-gray-900 text-base">{a.title}</p>
                          {a.student_status === 'completed' ? (
                            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-semibold shadow-sm">
                              <CheckCircle className="w-3.5 h-3.5" /> {t('teacher.studentDetail.assignments.statusCompleted', { score: a.student_score })}
                            </span>
                          ) : a.student_status === 'in_progress' ? (
                            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold shadow-sm">
                              <Clock className="w-3.5 h-3.5" /> {t('teacher.studentDetail.assignments.statusInProgress')}
                            </span>
                          ) : isOverdue ? (
                            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-semibold shadow-sm">
                              <Target className="w-3.5 h-3.5" /> {t('teacher.studentDetail.assignments.statusOverdue')}
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-md text-xs font-semibold shadow-sm">
                              <BookOpen className="w-3.5 h-3.5" /> {t('teacher.studentDetail.assignments.statusPending')}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2.5 mt-1">
                          <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-50/80 px-2.5 py-1.5 rounded-md border border-gray-200">
                            <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            {t('teacher.studentDetail.assignments.deadlinePrefix')}{a.deadline ? new Date(a.deadline).toLocaleDateString('vi-VN') : t('teacher.studentDetail.assignments.noDeadline')}
                          </div>
                          <div className="flex items-center text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-md border border-indigo-100">
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            {a.is_all_students ? t('teacher.studentDetail.assignments.assignedAll') : t('teacher.studentDetail.assignments.assignedSpecific')}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <BookOpen className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-900 font-medium text-lg">{t('teacher.studentDetail.assignments.noAssignments')}</p>
          <p className="text-gray-500 text-sm mt-1">{t('teacher.studentDetail.assignments.noAssignmentsDesc')}</p>
        </div>
      )}

      {selectedSessionId && (
        <SessionResultModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
};

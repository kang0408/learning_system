import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Clock, Eye, EyeOff, Edit2, Trash2, Search, X, Filter } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ui/Dialog';
import { useClassMutations } from '../hooks/useClassDetailData';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';

interface AssignmentsTabProps {
  assignments: any[];
  classStats?: any;
  membersCount?: number;
  classId: string;
}

export function AssignmentsTab({ assignments, classId }: AssignmentsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { deleteAssignment, togglePublish } = useClassMutations(classId);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [publishFilter, setPublishFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  const modeOptions = [
    { label: t('teacher.classDetail.filterModeAll', 'Tất cả hình thức'), value: 'all' },
    { label: t('teacher.classDetail.standardMode', 'Luyện tập'), value: 'standard' },
    { label: t('teacher.classDetail.adaptiveMode', 'Luyện tập ngắt quãng'), value: 'adaptive' },
    { label: t('teacher.classDetail.examMode', 'Thi cử'), value: 'exam' },
  ];

  const publishOptions = [
    { label: t('teacher.classDetail.filterPublishAll', 'Tất cả phát hành'), value: 'all' },
    { label: t('teacher.classDetail.published', 'Đã phát hành'), value: 'published' },
    { label: t('teacher.classDetail.draft', 'Bản nháp'), value: 'draft' },
  ];

  const statusOptions = [
    { label: t('teacher.classDetail.filterStatusAll', 'Tất cả trạng thái'), value: 'all' },
    { label: t('teacher.classDetail.ongoing', 'Đang diễn ra'), value: 'ongoing' },
    { label: t('teacher.classDetail.completed', 'Hoàn thành'), value: 'completed' },
    { label: t('teacher.classDetail.overdue', 'Quá hạn'), value: 'overdue' },
  ];

  const filteredAssignments = useMemo(() => {
    let list = assignments || [];

    // 1. Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((a) => {
        const titleMatch = a.title?.toLowerCase().includes(term);
        const descMatch = a.description?.toLowerCase().includes(term);
        return titleMatch || descMatch;
      });
    }

    // 2. Mode filter
    if (modeFilter !== 'all') {
      list = list.filter((a) => a.mode === modeFilter);
    }

    // 3. Publish status filter
    if (publishFilter !== 'all') {
      const isPub = publishFilter === 'published';
      list = list.filter((a) => !!a.is_published === isPub);
    }

    // 4. Status filter
    if (statusFilter !== 'all') {
      list = list.filter((a) => {
        if (statusFilter === 'overdue') {
          return a.deadline && new Date(a.deadline) < new Date() && a.status !== 'completed';
        }
        return a.status === statusFilter;
      });
    }

    return list;
  }, [assignments, searchTerm, modeFilter, publishFilter, statusFilter]);

  const hasActiveFilters = searchTerm.trim() !== '' || modeFilter !== 'all' || publishFilter !== 'all' || statusFilter !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setModeFilter('all');
    setPublishFilter('all');
    setStatusFilter('all');
  };

  const handleConfirmDelete = () => {
    if (assignmentToDelete) {
      deleteAssignment.mutate(assignmentToDelete, {
        onSuccess: () => {
          toast.success(t('teacher.classDetail.deleteAssignmentSuccess'));
          setAssignmentToDelete(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || t('teacher.classDetail.deleteAssignmentError'));
        },
      });
    }
  };

  const handleTogglePublish = (assignmentId: string, isPublished: boolean) => {
    togglePublish.mutate(
      { assignmentId, isPublished },
      {
        onSuccess: () => {
          if (isPublished) {
            toast.success(t('teacher.classDetail.unpublishSuccess'));
          } else {
            toast.success(t('teacher.classDetail.publishSuccess'));
          }
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || t('teacher.classDetail.togglePublishError'));
        },
      }
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" aria-hidden="true" /> {t('teacher.classDetail.manageAssignments')}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t('teacher.classDetail.assignmentsDesc')}</p>
        </div>
        <Link to={`/teacher/classes/${classId}/assignments/new`} className="w-full sm:w-auto">
          <Button variant="primary" size="md" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> {t('teacher.classDetail.createNewAssignment')}
          </Button>
        </Link>
      </div>

      {assignments && assignments.length > 0 ? (
        <>
          {/* Search & Filter Toolbar */}
          <div className="p-4 sm:px-6 border-b border-gray-100 bg-white flex flex-col xl:flex-row gap-3 justify-between items-stretch xl:items-center">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('teacher.classDetail.searchAssignmentsPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
                    title={t('teacher.classDetail.clearSearch')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mode Filter */}
              <div className="w-full sm:w-44">
                <Select
                  value={modeFilter}
                  onChange={setModeFilter}
                  options={modeOptions}
                  size="sm"
                />
              </div>

              {/* Publish Filter */}
              <div className="w-full sm:w-44">
                <Select
                  value={publishFilter}
                  onChange={setPublishFilter}
                  options={publishOptions}
                  size="sm"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-44">
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                  size="sm"
                />
              </div>
            </div>

            {/* Clear Filters & Count */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <span className="text-xs font-semibold text-slate-500">
                {t('teacher.classDetail.showingCount', { count: filteredAssignments.length, total: assignments.length })}
              </span>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2.5"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  {t('teacher.classDetail.clearFilters', 'Xóa bộ lọc')}
                </Button>
              )}
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {t('teacher.classDetail.noSearchAssignments')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-5">
                {t('teacher.classDetail.noSearchAssignmentsDesc', { term: searchTerm || 'bộ lọc đã chọn' })}
              </p>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                {t('teacher.classDetail.clearFilters', 'Xóa bộ lọc')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-72">{t('teacher.classDetail.assignment')}</TableHead>
                  <TableHead>{t('teacher.classDetail.mode')}</TableHead>
                  <TableHead>{t('teacher.classDetail.submissionProgress')}</TableHead>
                  <TableHead>{t('teacher.classDetail.classAvgScore')}</TableHead>
                  <TableHead>{t('teacher.classDetail.deadline')}</TableHead>
                  <TableHead>{t('teacher.classDetail.status')}</TableHead>
                  <TableHead className="text-right w-44">{t('teacher.classDetail.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment: any) => {
                  const submittedCount = assignment.stats?.submitted_count || 0;
                  const totalCount = assignment.stats?.total_students || 1;
                  const progressPct = Math.round((submittedCount / totalCount) * 100);
                  const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-bold text-slate-900">
                        <Link
                          to={`/teacher/classes/${classId}/assignments/${assignment.id}`}
                          className="hover:text-indigo-600 transition-colors block"
                        >
                          <span className="line-clamp-1">{assignment.title}</span>
                          {assignment.description && (
                            <span className="text-xs text-slate-400 font-normal line-clamp-1 mt-0.5">
                              {assignment.description}
                            </span>
                          )}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <Badge variant={assignment.mode === 'exam' ? 'danger' : assignment.mode === 'adaptive' ? 'warning' : 'indigo'}>
                          {assignment.mode === 'standard'
                            ? t('teacher.classDetail.standardMode')
                            : assignment.mode === 'adaptive'
                            ? t('teacher.classDetail.adaptiveMode')
                            : t('teacher.classDetail.examMode')}
                        </Badge>
                      </TableCell>

                      <TableCell className="w-48">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span>
                              {t('teacher.classDetail.progressCount', { submitted: submittedCount, total: totalCount })}
                            </span>
                            <span>{progressPct}%</span>
                          </div>
                          <Progress value={progressPct} variant={progressPct === 100 ? 'success' : 'indigo'} />
                        </div>
                      </TableCell>

                      <TableCell className="font-bold text-slate-900">
                        {assignment.stats?.avg_score !== undefined && assignment.stats?.avg_score !== null ? (
                          <span>{Number(assignment.stats.avg_score).toFixed(1)} / 100</span>
                        ) : (
                          <span className="text-slate-400 font-normal">--</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-500 font-medium">
                        {assignment.deadline ? (
                          <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            {new Date(assignment.deadline).toLocaleDateString('vi-VN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400">{t('teacher.classDetail.noDeadline')}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={assignment.is_published ? 'success' : 'default'}>
                            {assignment.is_published ? t('teacher.classDetail.published') : t('teacher.classDetail.draft')}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              assignment.is_published
                                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            onClick={() => handleTogglePublish(assignment.id, assignment.is_published)}
                            title={
                              assignment.is_published
                                ? t('teacher.classDetail.unpublish')
                                : t('teacher.classDetail.publishToStudents')
                            }
                            aria-label={
                              assignment.is_published
                                ? t('teacher.classDetail.unpublish')
                                : t('teacher.classDetail.publishToStudents')
                            }
                          >
                            {assignment.is_published ? (
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <Eye className="w-4 h-4" aria-hidden="true" />
                            )}
                          </Button>

                          <Link to={`/teacher/classes/${classId}/assignments/${assignment.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              title={t('teacher.classDetail.editAssignment')}
                              aria-label={t('teacher.classDetail.editAssignment')}
                            >
                              <Edit2 className="w-4 h-4" aria-hidden="true" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setAssignmentToDelete(assignment.id)}
                            title={t('teacher.classDetail.deleteAssignment')}
                            aria-label={t('teacher.classDetail.deleteAssignment')}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </>
      ) : (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-indigo-600" />}
          title={t('teacher.classDetail.noAssignmentsData')}
          actionLabel={t('teacher.classDetail.createNewAssignment')}
          onAction={() => navigate(`/teacher/classes/${classId}/assignments/new`)}
        />
      )}

      <ConfirmDialog
        isOpen={!!assignmentToDelete}
        onClose={() => setAssignmentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t('teacher.classDetail.deleteAssignmentTitle')}
        description={t('teacher.classDetail.deleteAssignmentDesc')}
        confirmText={t('teacher.classDetail.deleteAssignmentConfirmBtn')}
        isDanger={true}
        isLoading={deleteAssignment.isPending}
      />
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Clock, Eye, EyeOff, Edit2, Trash2, Search, X } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ui/Dialog';
import { useClassMutations } from '../hooks/useClassDetailData';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface AssignmentsTabProps {
  assignments: any[];
  classStats?: any;
  membersCount?: number;
  classId: string;
}

export function AssignmentsTab({ assignments, classId }: AssignmentsTabProps) {
  const { t } = useTranslation();
  const { deleteAssignment, togglePublish } = useClassMutations(classId);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  const filteredAssignments = useMemo(() => {
    if (!searchTerm.trim()) return assignments || [];
    const term = searchTerm.toLowerCase().trim();
    return (assignments || []).filter((a) => {
      const titleMatch = a.title?.toLowerCase().includes(term);
      const descMatch = a.description?.toLowerCase().includes(term);
      const modeMatch = (
        a.mode === 'standard' ? t('teacher.classDetail.standardMode') :
        a.mode === 'adaptive' ? t('teacher.classDetail.adaptiveMode') :
        a.mode === 'exam' ? t('teacher.classDetail.examMode') : a.mode
      )?.toLowerCase().includes(term);
      const statusMatch = (
        a.status === 'completed' ? t('teacher.classDetail.completed') :
        a.status === 'overdue' ? t('teacher.classDetail.overdue') :
        a.status === 'ongoing' ? t('teacher.classDetail.ongoing') : a.status
      )?.toLowerCase().includes(term);
      const pubMatch = (
        a.is_published ? t('teacher.classDetail.published') : t('teacher.classDetail.draft')
      )?.toLowerCase().includes(term);
      return titleMatch || descMatch || modeMatch || statusMatch || pubMatch;
    });
  }, [assignments, searchTerm, t]);

  const handleConfirmDelete = () => {
    if (assignmentToDelete) {
      deleteAssignment.mutate(assignmentToDelete, {
        onSuccess: () => {
          toast.success(t('teacher.classDetail.deleteAssignmentSuccess'));
          setAssignmentToDelete(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || t('teacher.classDetail.deleteAssignmentError'));
        }
      });
    }
  };

  const handleTogglePublish = (assignmentId: string, isPublished: boolean) => {
    togglePublish.mutate({ assignmentId, isPublished }, {
      onSuccess: () => {
        if (isPublished) {
          toast.success(t('teacher.classDetail.unpublishSuccess'));
        } else {
          toast.success(t('teacher.classDetail.publishSuccess'));
        }
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || t('teacher.classDetail.togglePublishError'));
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          {/* Search Bar */}
          <div className="p-4 sm:px-6 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
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

            {searchTerm && (
              <div className="text-xs font-semibold text-slate-500 shrink-0">
                {t('teacher.classDetail.showingCount', { count: filteredAssignments.length, total: assignments.length })}
              </div>
            )}
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {t('teacher.classDetail.noSearchAssignments')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-5">
                {t('teacher.classDetail.noSearchAssignmentsDesc', { term: searchTerm })}
              </p>
              <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                {t('teacher.classDetail.clearSearch')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('teacher.classDetail.assignment')}</TableHead>
                  <TableHead className="text-center">{t('teacher.classDetail.mode')}</TableHead>
                  <TableHead className="text-center w-48">{t('teacher.classDetail.submissionProgress')}</TableHead>
                  <TableHead className="text-center w-36">{t('teacher.classDetail.classAvgScore')}</TableHead>
                  <TableHead className="w-48">{t('teacher.classDetail.deadline')}</TableHead>
                  <TableHead className="text-center">{t('teacher.classDetail.status')}</TableHead>
                  <TableHead className="text-right w-40">{t('teacher.classDetail.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map(assignment => {
                  const submissionPct = assignment.total_students === 0 ? 0 : (assignment.submitted_count / assignment.total_students) * 100;
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-base">{assignment.title}</div>
                        {assignment.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">{assignment.description}</p>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={assignment.mode === 'standard' ? 'indigo' : assignment.mode === 'adaptive' ? 'secondary' : 'warning'}>
                          {assignment.mode === 'standard' ? t('teacher.classDetail.standardMode') :
                           assignment.mode === 'adaptive' ? t('teacher.classDetail.adaptiveMode') : t('teacher.classDetail.examMode')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="text-slate-900 font-bold text-xs">{assignment.submitted_count} / {assignment.total_students}</div>
                          <Progress value={submissionPct} variant={submissionPct === 100 ? 'success' : 'indigo'} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900">
                        {assignment.avg_score || '--'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {assignment.deadline ? (
                          <div className="flex items-center text-slate-700 font-semibold">
                            <Clock className="w-4 h-4 text-slate-400 mr-1.5 shrink-0" />
                            <span className={assignment.status === 'overdue' ? 'text-red-600 font-bold' : ''}>
                              {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">{t('teacher.classDetail.noDeadline')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <Badge variant={assignment.is_published ? 'indigo' : 'default'} size="sm">
                            {assignment.is_published ? t('teacher.classDetail.published') : t('teacher.classDetail.draft')}
                          </Badge>
                          <Badge 
                            variant={assignment.status === 'completed' ? 'success' : assignment.status === 'overdue' ? 'danger' : assignment.status === 'ongoing' ? 'indigo' : 'default'} 
                            size="sm"
                          >
                            {assignment.status === 'completed' ? t('teacher.classDetail.completed') :
                             assignment.status === 'overdue' ? t('teacher.classDetail.overdue') :
                             assignment.status === 'ongoing' ? t('teacher.classDetail.ongoing') :
                             assignment.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePublish(assignment.id, assignment.is_published)}
                            title={assignment.is_published ? t('teacher.classDetail.unpublish') : t('teacher.classDetail.publishToStudents')}
                          >
                            {assignment.is_published ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-indigo-600" />}
                          </Button>
                          <Link to={`/teacher/classes/${classId}/assignments/${assignment.id}/edit`}>
                            <Button variant="ghost" size="icon" title={t('teacher.classDetail.editAssignment')}>
                              <Edit2 className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAssignmentToDelete(assignment.id)}
                            title={t('teacher.classDetail.deleteAssignment')}
                          >
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
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


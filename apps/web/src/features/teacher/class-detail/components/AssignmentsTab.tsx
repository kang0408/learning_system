import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Clock, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
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
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

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
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" aria-hidden="true" /> {t('teacher.classDetail.manageAssignments')}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t('teacher.classDetail.assignmentsDesc')}</p>
        </div>
        <Link to={`/teacher/classes/${classId}/assignments/new`}>
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> {t('teacher.classDetail.createNewAssignment')}
          </Button>
        </Link>
      </div>

      {assignments && assignments.length > 0 ? (
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
            {assignments.map(assignment => {
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


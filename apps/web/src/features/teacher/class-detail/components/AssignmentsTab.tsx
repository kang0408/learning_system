import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Award, Calendar, Clock, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ui/Dialog';
import { useClassMutations } from '../hooks/useClassDetailData';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-900" aria-hidden="true" /> {t('teacher.classDetail.manageAssignments')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t('teacher.classDetail.assignmentsDesc')}</p>
        </div>
        <Link 
          to={`/teacher/classes/${classId}/assignments/new`} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> {t('teacher.classDetail.createNewAssignment')}
        </Link>
      </div>

      {assignments && assignments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50/50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-3.5 text-left">{t('teacher.classDetail.assignment')}</th>
                <th className="px-6 py-3.5 text-center w-32">{t('teacher.classDetail.mode')}</th>
                <th className="px-6 py-3.5 text-center w-40">{t('teacher.classDetail.submissionProgress')}</th>
                <th className="px-6 py-3.5 text-center w-40">{t('teacher.classDetail.classAvgScore')}</th>
                <th className="px-6 py-3.5 text-left w-48">{t('teacher.classDetail.deadline')}</th>
                <th className="px-6 py-3.5 text-center w-32">{t('teacher.classDetail.status')}</th>
                <th className="px-6 py-3.5 text-right w-40">{t('teacher.classDetail.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-gray-700 font-medium">
              {assignments.map(assignment => {
                return (
                  <tr key={assignment.id} className="hover:bg-gray-50/80 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 text-base">{assignment.title}</div>
                      {assignment.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{assignment.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${assignment.mode === 'standard' ? 'bg-blue-100 text-blue-800' :
                          assignment.mode === 'adaptive' ? 'bg-purple-100 text-purple-800' :
                          'bg-amber-100 text-amber-800'}`}>
                        {assignment.mode === 'standard' ? t('teacher.classDetail.standardMode') :
                         assignment.mode === 'adaptive' ? t('teacher.classDetail.adaptiveMode') : t('teacher.classDetail.examMode')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <div className="text-gray-900 font-bold mb-1">{assignment.submitted_count} / {assignment.total_students}</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${assignment.total_students === 0 ? 'bg-gray-200' : assignment.submitted_count === assignment.total_students ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${assignment.total_students === 0 ? 0 : (assignment.submitted_count / assignment.total_students) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900">
                      {assignment.avg_score || '--'}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {assignment.deadline ? (
                        <div className="flex items-center text-gray-700">
                          <Clock className="w-4 h-4 text-gray-400 mr-1.5" />
                          <span className={assignment.status === 'overdue' ? 'text-red-600 font-bold' : ''}>
                            {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">{t('teacher.classDetail.noDeadline')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {/* Publish Status */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${assignment.is_published ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                          {assignment.is_published ? t('teacher.classDetail.published') : t('teacher.classDetail.draft')}
                        </span>
                        
                        {/* Progress Status */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold
                          ${assignment.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            assignment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            assignment.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {assignment.status === 'completed' ? t('teacher.classDetail.completed') :
                           assignment.status === 'overdue' ? t('teacher.classDetail.overdue') :
                           assignment.status === 'ongoing' ? t('teacher.classDetail.ongoing') :
                           assignment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePublish(assignment.id, assignment.is_published)}
                          className={`p-2 rounded-lg transition-colors border ${
                            assignment.is_published 
                              ? 'text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-100' 
                              : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border-transparent hover:border-indigo-100'
                          }`}
                          title={assignment.is_published ? t('teacher.classDetail.unpublish') : t('teacher.classDetail.publishToStudents')}
                        >
                          {assignment.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <Link
                          to={`/teacher/classes/${classId}/assignments/${assignment.id}/edit`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title={t('teacher.classDetail.editAssignment')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setAssignmentToDelete(assignment.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title={t('teacher.classDetail.deleteAssignment')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 bg-gray-50/50">
          {t('teacher.classDetail.noAssignmentsData')}
        </div>
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

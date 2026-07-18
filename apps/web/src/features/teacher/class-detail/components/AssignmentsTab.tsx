import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Award, Calendar, CheckCircle2, AlertCircle, Clock, Send, EyeOff, Edit, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ui/Dialog';
import { useClassMutations } from '../hooks/useClassDetailData';

import { toast } from '@/utils/toast';

interface AssignmentsTabProps {
  assignments: any[];
  classStats: any;
  membersCount: number;
  classId: string;
}

export function AssignmentsTab({ assignments, classStats, membersCount, classId }: AssignmentsTabProps) {
  const { deleteAssignment, togglePublish } = useClassMutations(classId);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (assignmentToDelete) {
      deleteAssignment.mutate(assignmentToDelete, {
        onSuccess: () => {
          toast.success('Xóa bài tập thành công!');
          setAssignmentToDelete(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa bài tập');
        }
      });
    }
  };

  const handleTogglePublish = (assignmentId: string, isPublished: boolean) => {
    togglePublish.mutate({ assignmentId, isPublished }, {
      onSuccess: () => {
        toast.success(isPublished ? 'Hủy phát hành bài tập thành công!' : 'Phát hành bài tập thành công!');
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái bài tập');
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-900" aria-hidden="true" /> Quản lý bài tập giao cho lớp
          </h2>
          <p className="text-sm text-gray-500 mt-1">Danh sách các bài tập đã giao, theo dõi tỷ lệ nộp bài, điểm số trung bình lớp và hạn chót.</p>
        </div>
        <Link
          to={`/teacher/classes/${classId}/assignments/new`}
          className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" /> Tạo bài tập mới
        </Link>
      </div>

      {assignments && assignments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50/50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-3.5 text-left">Bài tập</th>
                <th className="px-6 py-3.5 text-left">Hình thức</th>
                <th className="px-6 py-3.5 text-left w-56">Tiến độ nộp bài</th>
                <th className="px-6 py-3.5 text-center">Điểm trung bình lớp</th>
                <th className="px-6 py-3.5 text-left">Hạn chót</th>
                <th className="px-6 py-3.5 text-center">Trạng thái</th>
                <th className="px-6 py-3.5 text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-gray-700 font-medium">
              {assignments.map(assignment => {
                const submittedCount = assignment.submitted_count || 0;
                const totalStudents = assignment.total_students || classStats?.total_students || membersCount || 1;
                const submissionRate = assignment.submission_rate || 0;
                const avgScore = assignment.avg_score || 0;
                const status = assignment.status || 'ongoing';
                const deadlineDate = assignment.deadline ? new Date(assignment.deadline) : null;

                return (
                  <tr key={assignment.id} className="hover:bg-gray-50/80 transition duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-gray-900 text-base">{assignment.title}</span>
                        {assignment.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{assignment.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        assignment.mode === 'standard' ? 'bg-slate-100 text-slate-900 border-slate-200' : 
                        assignment.mode === 'adaptive' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {assignment.mode === 'standard' ? 'Luyện tập' : assignment.mode === 'adaptive' ? 'Thích ứng' : 'Thi cử'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-gray-500 font-semibold">
                          <span>Tiến độ: {submittedCount}/{totalStudents} học sinh</span>
                          <span>{submissionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${status === 'completed' ? 'bg-green-500' : 'bg-slate-900'}`}
                            style={{ width: `${submissionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-950 font-bold">
                      {avgScore > 0 ? (
                        <span className="flex items-center justify-center gap-1">
                          <Award className="w-4 h-4 text-slate-900" aria-hidden="true" /> {avgScore} pts
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      {deadlineDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" aria-hidden="true" />
                          <span>{deadlineDate.toLocaleDateString('vi-VN')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Không có hạn</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center flex flex-col items-center gap-1">
                      <div>
                        {status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Hoàn thành
                          </span>
                        ) : status === 'overdue' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-full">
                            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> Quá hạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold rounded-full">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Đang diễn ra
                          </span>
                        )}
                      </div>
                      <div>
                        {assignment.is_published ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
                            <Send className="w-3.5 h-3.5" aria-hidden="true" /> Đã phát hành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-full">
                            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> Bản nháp
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePublish(assignment.id, assignment.is_published)}
                          disabled={togglePublish.isPending}
                          className={`p-2 rounded-lg transition-colors border border-transparent ${
                            assignment.is_published 
                              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100'
                              : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100'
                          } disabled:opacity-50`}
                          title={assignment.is_published ? "Hủy phát hành" : "Phát hành cho học sinh"}
                          aria-label={assignment.is_published ? "Hủy phát hành" : "Phát hành cho học sinh"}
                        >
                          {assignment.is_published ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
                        </button>
                        <Link 
                          to={`/teacher/classes/${classId}/assignments/${assignment.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Chỉnh sửa bài tập"
                          aria-label="Chỉnh sửa bài tập"
                        >
                          <Edit className="w-4 h-4" aria-hidden="true" />
                        </Link>
                        <button 
                          onClick={() => setAssignmentToDelete(assignment.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Xóa bài tập"
                          aria-label="Xóa bài tập"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
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
          Lớp học chưa có bài tập nào được giao.
        </div>
      )}

      <ConfirmDialog
        isOpen={!!assignmentToDelete}
        onClose={() => setAssignmentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa bài tập"
        description="Bạn có chắc chắn muốn xóa bài tập này? Mọi dữ liệu làm bài của học sinh sẽ bị mất."
        confirmText="Xóa bài tập"
        isDanger={true}
        isLoading={deleteAssignment.isPending}
      />
    </div>
  );
}

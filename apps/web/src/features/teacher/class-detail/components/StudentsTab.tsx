import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Trophy, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ui/Dialog';
import { useClassMutations } from '../hooks/useClassDetailData';

import { toast } from '@/utils/toast';

interface StudentsTabProps {
  analytics: any;
  members: any[];
  classId: string;
}

export function StudentsTab({ analytics, members, classId }: StudentsTabProps) {
  const { removeStudent } = useClassMutations(classId);
  const [studentToRemove, setStudentToRemove] = useState<{id: string, name: string} | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa hoạt động';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleConfirmRemove = () => {
    if (studentToRemove) {
      removeStudent.mutate(studentToRemove.id, {
        onSuccess: () => {
          toast.success(`Đã xoá học sinh ${studentToRemove.name} khỏi lớp`);
          setStudentToRemove(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xoá học sinh');
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-slate-900" aria-hidden="true" /> Danh sách học tập và xếp hạng
          </h2>
          <p className="text-sm text-gray-500 mt-1">Thống kê điểm số tích lũy, số lượt nộp bài, tỷ lệ chính xác.</p>
        </div>
        <span className="px-3 py-1 bg-slate-100 text-slate-900 text-sm font-semibold rounded-full border border-slate-200">
          Tổng số: {members?.length || 0} học sinh
        </span>
      </div>

      {analytics?.leaderboard && analytics.leaderboard.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50/50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-3.5 text-center w-16">Thứ hạng</th>
                <th className="px-6 py-3.5 text-left">Học sinh</th>
                <th className="px-6 py-3.5 text-left">Điểm tích lũy</th>
                <th className="px-6 py-3.5 text-center">Độ chính xác</th>
                <th className="px-6 py-3.5 text-center">Tiến độ SM2</th>
                <th className="px-6 py-3.5 text-left">Hoạt động cuối cùng</th>
                <th className="px-6 py-3.5 text-right w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-gray-700 font-medium">
              {analytics.leaderboard.map((student: any, index: number) => {
                const isTop3 = index < 3;
                return (
                  <tr key={student.student_id} className="hover:bg-gray-50/80 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isTop3 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                          index === 1 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-orange-100 text-orange-700 border border-orange-200'
                          }`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-semibold">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center font-bold mr-3">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold flex items-center gap-1 mt-1">
                      <Trophy className="w-4 h-4 text-amber-500" /> {student.score} pts
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${(student.accuracy || 0) >= 75 ? 'bg-green-50 text-green-700 border-green-200' :
                        (student.accuracy || 0) >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        {student.accuracy || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-gray-900" title="Đã thành thạo / Tổng số câu đã học">
                          {student.sm2_mastered_q || 0} / {student.sm2_total_q || 0} câu
                        </span>
                        {student.sm2_avg_ef && (
                          <span className="text-gray-500 font-medium" title="Độ trôi chảy (Avg Easiness Factor)">
                            EF: {Number(student.sm2_avg_ef).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                      {formatDate(student.last_active_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/teacher/classes/${classId}/members/${student.student_id}`}
                          className="px-3 py-1.5 bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-lg transition font-semibold text-sm inline-flex items-center border border-slate-200"
                        >
                          Chi tiết
                        </Link>
                        <button
                          onClick={() => setStudentToRemove({id: student.student_id, name: student.name})}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title={`Xóa ${student.name} khỏi lớp`}
                          aria-label={`Xóa ${student.name} khỏi lớp`}
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
          Lớp học chưa có thành viên học sinh hoặc chưa có dữ liệu nộp bài.
        </div>
      )}

      <ConfirmDialog
        isOpen={!!studentToRemove}
        onClose={() => setStudentToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Xóa học sinh"
        description={`Bạn có chắc chắn muốn xóa học sinh ${studentToRemove?.name} khỏi lớp?`}
        confirmText="Xóa học sinh"
        isDanger={true}
        isLoading={removeStudent.isPending}
      />
    </div>
  );
}

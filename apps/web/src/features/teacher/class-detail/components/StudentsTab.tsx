import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Trophy, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ui/Dialog';
import { useClassMutations } from '../hooks/useClassDetailData';
import { useTranslation } from 'react-i18next';
import { toast } from '@/utils/toast';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/Table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface StudentsTabProps {
  analytics: any;
  members: any[];
  classId: string;
}

export function StudentsTab({ analytics, members, classId }: StudentsTabProps) {
  const { t } = useTranslation();
  const { removeStudent } = useClassMutations(classId);
  const [studentToRemove, setStudentToRemove] = useState<{id: string, name: string} | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('teacher.classDetail.inactive');
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleConfirmRemove = () => {
    if (studentToRemove) {
      removeStudent.mutate(studentToRemove.id, {
        onSuccess: () => {
          toast.success(t('teacher.classDetail.removeStudentSuccess', { name: studentToRemove.name }));
          setStudentToRemove(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || t('teacher.classDetail.removeStudentError'));
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" aria-hidden="true" /> {t('teacher.classDetail.studentListAndRanking')}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t('teacher.classDetail.studentStatsDesc')}</p>
        </div>
        <Badge variant="secondary" size="md">
          {t('teacher.classDetail.totalStudentsCount', { count: members?.length || 0 })}
        </Badge>
      </div>

      {analytics?.leaderboard && analytics.leaderboard.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-16">{t('teacher.classDetail.rank')}</TableHead>
              <TableHead>{t('teacher.classDetail.student')}</TableHead>
              <TableHead>{t('teacher.classDetail.cumulativeScore')}</TableHead>
              <TableHead className="text-center">{t('teacher.classDetail.accuracy')}</TableHead>
              <TableHead className="text-center">{t('teacher.classDetail.sm2Progress')}</TableHead>
              <TableHead>{t('teacher.classDetail.lastActivity')}</TableHead>
              <TableHead className="text-right w-36">{t('teacher.classDetail.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytics.leaderboard.map((student: any, index: number) => {
              const isTop3 = index < 3;
              const member = members?.find((m: any) => m.student_id === student.student_id);
              let avatarUrl = member?.student?.avatar_url;
              if (avatarUrl && !avatarUrl.startsWith('http')) {
                avatarUrl = `${import.meta.env.VITE_API_URL}${avatarUrl}`;
              }
              
              return (
                <TableRow key={student.student_id}>
                  <TableCell className="text-center font-bold">
                    {isTop3 ? (
                      <Badge variant={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'indigo'} size="sm" className="rounded-full w-7 h-7 p-0 flex items-center justify-center mx-auto">
                        {index + 1}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 font-semibold">{index + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={student.name} />}
                        <AvatarFallback name={student.name} />
                      </Avatar>
                      <span className="font-bold text-slate-900">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-amber-500" /> {student.score} pts
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={(student.accuracy || 0) >= 75 ? 'success' : (student.accuracy || 0) >= 50 ? 'warning' : 'danger'}>
                      {student.accuracy || 0}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-bold text-slate-900" title="Đã thành thạo / Tổng số câu đã học">
                        {student.sm2_mastered_q || 0} / {student.sm2_total_q || 0} câu
                      </span>
                      {student.sm2_avg_ef && (
                        <span className="text-slate-500 font-semibold text-[11px]" title="Độ trôi chảy (Avg Easiness Factor)">
                          EF: {Number(student.sm2_avg_ef).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium">
                    {formatDate(student.last_active_at)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/teacher/classes/${classId}/members/${student.student_id}`} className="inline-flex">
                        <Button variant="outline" size="sm" className="whitespace-nowrap">
                          {t('teacher.classDetail.details')}
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setStudentToRemove({id: student.student_id, name: student.name})}
                        title={t('teacher.classDetail.removeStudentTitle')}
                        aria-label={t('teacher.classDetail.removeStudentTitle')}
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
      ) : (
        <EmptyState
          icon={<GraduationCap className="w-8 h-8 text-indigo-600" />}
          title={t('teacher.classDetail.noStudentData')}
        />
      )}

      <ConfirmDialog
        isOpen={!!studentToRemove}
        onClose={() => setStudentToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={t('teacher.classDetail.removeStudentTitle')}
        description={t('teacher.classDetail.removeStudentDesc', { name: studentToRemove?.name })}
        confirmText={t('teacher.classDetail.removeStudentConfirmBtn')}
        isDanger={true}
        isLoading={removeStudent.isPending}
      />
    </div>
  );
}


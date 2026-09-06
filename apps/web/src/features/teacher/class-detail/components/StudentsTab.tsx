import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Trophy, Trash2, Search, X, Filter } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ui/Dialog';
import { useClassMutations } from '../hooks/useClassDetailData';
import { useTranslation } from 'react-i18next';
import { toast } from '@/utils/toast';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/Table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';

interface StudentsTabProps {
  analytics: any;
  members: any[];
  classId: string;
}

export function StudentsTab({ analytics, members, classId }: StudentsTabProps) {
  const { t } = useTranslation();
  const { removeStudent } = useClassMutations(classId);
  const [searchTerm, setSearchTerm] = useState('');
  const [accuracyFilter, setAccuracyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rank');
  const [studentToRemove, setStudentToRemove] = useState<{ id: string; name: string } | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('teacher.classDetail.inactive');
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        },
      });
    }
  };

  const accuracyOptions = [
    { label: t('teacher.classDetail.filterAccuracyAll', 'Tất cả độ chính xác'), value: 'all' },
    { label: t('teacher.classDetail.filterAccuracyHigh', 'Xuất sắc (≥75%)'), value: 'high' },
    { label: t('teacher.classDetail.filterAccuracyMed', 'Trung bình (50-74%)'), value: 'medium' },
    { label: t('teacher.classDetail.filterAccuracyLow', 'Cần cố gắng (<50%)'), value: 'low' },
  ];

  const sortOptions = [
    { label: t('teacher.classDetail.sortRank', 'Thứ hạng điểm số'), value: 'rank' },
    { label: t('teacher.classDetail.sortAccuracy', 'Tỷ lệ chính xác cao'), value: 'accuracy' },
    { label: t('teacher.classDetail.sortName', 'Tên học sinh (A-Z)'), value: 'name' },
    { label: t('teacher.classDetail.sortActivity', 'Hoạt động gần nhất'), value: 'activity' },
  ];

  const filteredStudents = useMemo(() => {
    const rawList = analytics?.leaderboard || [];
    if (!rawList.length) return [];

    let result = [...rawList];

    // 1. Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((student: any) => {
        const nameMatch = student.name?.toLowerCase().includes(term);
        const member = members?.find((m: any) => m.student_id === student.student_id);
        const emailMatch = member?.student?.email?.toLowerCase().includes(term);
        return nameMatch || emailMatch;
      });
    }

    // 2. Accuracy filter
    if (accuracyFilter !== 'all') {
      result = result.filter((student: any) => {
        const acc = Number(student.accuracy || 0);
        if (accuracyFilter === 'high') return acc >= 75;
        if (accuracyFilter === 'medium') return acc >= 50 && acc < 75;
        if (accuracyFilter === 'low') return acc < 50;
        return true;
      });
    }

    // 3. Sort
    result.sort((a: any, b: any) => {
      if (sortBy === 'accuracy') {
        return (Number(b.accuracy) || 0) - (Number(a.accuracy) || 0);
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'activity') {
        const timeA = a.last_active_at ? new Date(a.last_active_at).getTime() : 0;
        const timeB = b.last_active_at ? new Date(b.last_active_at).getTime() : 0;
        return timeB - timeA;
      }
      // default 'rank': by score desc
      return (Number(b.score) || 0) - (Number(a.score) || 0);
    });

    return result;
  }, [analytics?.leaderboard, members, searchTerm, accuracyFilter, sortBy]);

  const hasActiveFilters = searchTerm.trim() !== '' || accuracyFilter !== 'all' || sortBy !== 'rank';

  const handleClearFilters = () => {
    setSearchTerm('');
    setAccuracyFilter('all');
    setSortBy('rank');
  };

  return (
    <div className="bg-slate-50/40 rounded-3xl border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200/60 flex justify-between items-center bg-slate-50/80">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" aria-hidden="true" /> {t('teacher.classDetail.studentListAndRanking')}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t('teacher.classDetail.studentStatsDesc')}</p>
        </div>
        <Badge variant="indigo" size="md">
          {t('teacher.classDetail.totalStudentsCount', { count: members?.length || 0 })}
        </Badge>
      </div>

      {analytics?.leaderboard && analytics.leaderboard.length > 0 ? (
        <>
          {/* Search & Filter Toolbar */}
          <div className="p-4 sm:px-6 border-b border-slate-200/60 bg-white/70 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('teacher.classDetail.searchStudentsPlaceholder', 'Tìm kiếm theo tên học sinh...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
                    title={t('teacher.classDetail.clearSearch', 'Xóa tìm kiếm')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Accuracy Filter */}
              <div className="w-full sm:w-48">
                <Select
                  value={accuracyFilter}
                  onChange={setAccuracyFilter}
                  options={accuracyOptions}
                  size="sm"
                />
              </div>

              {/* Sort Order */}
              <div className="w-full sm:w-48">
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions}
                  size="sm"
                />
              </div>
            </div>

            {/* Clear Filters & Count */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <span className="text-xs font-semibold text-slate-500">
                {t('teacher.classDetail.showingCount', {
                  count: filteredStudents.length,
                  total: analytics.leaderboard.length,
                  defaultValue: `Hiển thị ${filteredStudents.length} / ${analytics.leaderboard.length} học sinh`,
                })}
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

          {/* Table or Empty filtered state */}
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {t('teacher.classDetail.noSearchStudents', 'Không tìm thấy học sinh nào')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-5">
                {t('teacher.classDetail.noSearchStudentsDesc', 'Không có học sinh nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.')}
              </p>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                {t('teacher.classDetail.clearFilters', 'Xóa bộ lọc')}
              </Button>
            </div>
          ) : (
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
                {filteredStudents.map((student: any, index: number) => {
                  const isTop3 = index < 3 && sortBy === 'rank';
                  const member = members?.find((m: any) => m.student_id === student.student_id);
                  let avatarUrl = member?.student?.avatar_url;
                  if (avatarUrl && !avatarUrl.startsWith('http')) {
                    avatarUrl = `${import.meta.env.VITE_API_URL}${avatarUrl}`;
                  }

                  return (
                    <TableRow key={student.student_id}>
                      <TableCell className="text-center font-bold">
                        {isTop3 ? (
                          <Badge
                            variant={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'indigo'}
                            size="sm"
                            className="rounded-full w-7 h-7 p-0 flex items-center justify-center mx-auto"
                          >
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
                            onClick={() => setStudentToRemove({ id: student.student_id, name: student.name })}
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
          )}
        </>
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

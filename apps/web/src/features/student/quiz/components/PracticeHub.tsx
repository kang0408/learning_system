import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Brain, 
  Clock, 
  Flame, 
  ArrowUpRight, 
  Search, 
  X, 
  CheckCircle2, 
  BookOpen
} from 'lucide-react';
import { useDashboardData } from '../../dashboard/hooks/useDashboardData';

export const PracticeHub: React.FC = () => {
  const { t } = useTranslation();
  const { analytics, assignments, dailySchedule, summary } = useDashboardData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'adaptive' | 'pending' | 'completed'>('all');

  const dueTodayCount = summary?.due_today_count || analytics?.questions_due_today || 0;
  const streakDays = analytics?.current_streak_days || 0;
  const completedAssignmentsCount = useMemo(() => {
    return assignments?.filter(a => a.quiz_sessions?.some(s => s.status === 'completed')).length || 0;
  }, [assignments]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    let list = assignments || [];

    if (filterTab === 'adaptive') {
      list = list.filter((a: any) => a.mode === 'adaptive');
    } else if (filterTab === 'pending') {
      list = list.filter(a => {
        const completed = a.quiz_sessions?.some(s => s.status === 'completed');
        return !completed;
      });
    } else if (filterTab === 'completed') {
      list = list.filter(a => {
        return a.quiz_sessions?.some(s => s.status === 'completed');
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) || 
        (a.class?.name && a.class.name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [assignments, filterTab, searchQuery]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header / Hero Section */}
      <div className="border-4 border-zinc-900 bg-[#FDFBF7] p-6 sm:p-10 shadow-[8px_8px_0_0_#18181b]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-zinc-900">
              <Brain className="w-4 h-4" />
              <span>{t('student.practice.hubBadge', 'PRACTICE & RETENTION HUB')}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-zinc-900 leading-none">
              {t('student.practice.hubTitle', 'TRUNG TÂM LUYỆN TẬP')}
            </h1>
            <p className="text-zinc-600 font-medium text-base sm:text-lg">
              {t('student.practice.hubSubtitle', 'Luyện tập thích ứng cá nhân hóa và kích hoạt lặp lại ngắt quãng SM-2 để tối ưu hóa khả năng ghi nhớ dài hạn.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:w-[480px]">
            {/* Stat 1: Due Today */}
            <div className={`p-4 border-2 border-zinc-900 flex flex-col justify-between ${
              dueTodayCount > 0 ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {t('student.practice.dueToday', 'ÔN TẬP')}
                </span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black tracking-tight">{dueTodayCount}</span>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-80 mt-0.5">
                  {t('student.practice.questionsDue', 'Câu đến hạn')}
                </p>
              </div>
            </div>

            {/* Stat 2: Completed */}
            <div className="p-4 border-2 border-zinc-900 bg-white text-zinc-900 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {t('student.practice.completedLabel', 'HOÀN THÀNH')}
                </span>
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black tracking-tight text-indigo-600">{completedAssignmentsCount}</span>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">
                  {t('student.practice.completedDesc', 'Bài tập đã nộp')}
                </p>
              </div>
            </div>

            {/* Stat 3: Current Streak */}
            <div className="p-4 border-2 border-zinc-900 bg-white text-zinc-900 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {t('student.practice.streakDays', 'CHUỖI HỌC')}
                </span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black tracking-tight text-orange-600">{streakDays}</span>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">
                  {t('student.practice.daysInRow', 'Ngày liên tiếp')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Daily SM-2 Queue */}
      <div className="space-y-6">
        <div className="border-b-2 border-zinc-900 pb-3 flex items-center justify-between">
          <div>
            <span className="font-bold text-xs uppercase tracking-widest text-indigo-600">
              {t('student.practice.sm2QueueTitle', 'HÀNG ĐỢI ÔN TẬP TRÍ NHỚ (SM-2)')}
            </span>
            <h2 className="text-2xl font-black tracking-tighter uppercase">
              {t('student.practice.todayReviews', 'CÂU HỎI ĐẾN HẠN HÔM NAY')}
            </h2>
          </div>
          {dueTodayCount > 0 && (
            <span className="font-black text-xs uppercase tracking-widest bg-indigo-600 text-white px-3 py-1 border-2 border-zinc-900">
              {dueTodayCount} {t('student.practice.questions', 'CÂU')}
            </span>
          )}
        </div>

        {dailySchedule && dailySchedule.length > 0 ? (
          <div className="space-y-4">
            {dailySchedule.map((cls, idx) => (
              <div key={`cls-${idx}`} className="border-2 border-zinc-900 p-6 bg-indigo-50/50 space-y-4 shadow-[4px_4px_0_0_#18181b]">
                <div className="flex items-center justify-between gap-3 border-b-2 border-zinc-900 pb-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-black text-lg uppercase tracking-tight block truncate" title={cls.class_name}>
                      {cls.class_name}
                    </span>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                      {t('student.practice.classQueue', 'Lớp học')}
                    </p>
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest bg-white border-2 border-zinc-900 px-3 py-1 shrink-0 whitespace-nowrap">
                    {cls.total_due} {t('student.dashboard.dueLabel', 'CÂU CẦN ÔN')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cls.assignments.map((ass) => (
                    <div 
                      key={ass.assignment_id} 
                      className="bg-white border-2 border-zinc-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:-translate-y-0.5 transition-transform"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-base uppercase tracking-tight truncate" title={ass.title}>
                          {ass.title}
                        </h4>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mt-0.5">
                          {t('student.practice.estimatedTime', { minutes: Math.max(1, Math.ceil(cls.total_due * 0.75)), defaultValue: `~${Math.max(1, Math.ceil(cls.total_due * 0.75))} phút làm bài` })}
                        </span>
                      </div>

                      {ass.assignment_id !== 'general' ? (
                        <Link
                          to={`/quiz?assignment=${ass.assignment_id}&mode=review`}
                          className="inline-flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-widest bg-indigo-600 text-white px-5 py-2.5 border-2 border-zinc-900 hover:bg-zinc-900 transition-colors shadow-[2px_2px_0_0_#18181b]"
                        >
                          <span>{t('student.practice.startReview', 'BẮT ĐẦU ÔN')}</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <span className="font-bold text-xs uppercase tracking-widest text-zinc-400 bg-zinc-100 border border-zinc-300 px-3 py-1.5 text-center">
                          {t('student.practice.generalReview', 'ÔN TẬP CHUNG')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-zinc-300 bg-zinc-50 text-center space-y-3">
            <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 border-2 border-zinc-900 rounded-full">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-black text-lg uppercase tracking-tight text-zinc-800">
              {t('student.practice.allCaughtUp', 'TRÍ NHỚ ĐÃ ĐƯỢC TỐI ƯU')}
            </h4>
            <p className="text-sm font-medium text-zinc-500 max-w-md mx-auto">
              {t('student.practice.noDueQuestions', 'Bạn không còn câu hỏi nào đến hạn hôm nay theo thuật toán SM-2. Hãy tiếp tục luyện tập tự do bên dưới!')}
            </p>
          </div>
        )}
      </div>

      {/* Section 3: Available Assignments Catalog */}
      <div className="space-y-6 pt-6 border-t-4 border-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-zinc-900 pb-3">
          <div>
            <span className="font-bold text-xs uppercase tracking-widest text-zinc-500">
              {t('student.practice.allAssignmentsTitle', 'DANH MỤC BÀI TẬP')}
            </span>
            <h2 className="text-3xl font-black tracking-tighter uppercase">
              {t('student.practice.selectToPractice', 'CHỌN BÀI TẬP ĐỂ BẮT ĐẦU')}
            </h2>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('student.practice.searchPlaceholder', 'TÌM BÀI TẬP HOẶC MÔN HỌC...')}
              className="w-full pl-9 pr-8 py-2 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'adaptive', 'pending', 'completed'] as const).map(tab => {
            const isActive = filterTab === tab;
            const labels = {
              all: t('student.practice.filterAll', 'TẤT CẢ'),
              adaptive: t('student.practice.filterAdaptive', 'LUYỆN TẬP NGẮT QUÃNG'),
              pending: t('student.practice.filterPending', 'CHƯA HOÀN THÀNH'),
              completed: t('student.practice.filterCompleted', 'ĐÃ LÀM')
            };

            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`font-black text-xs uppercase tracking-widest px-4 py-2 border-2 border-zinc-900 transition-all ${
                  isActive 
                    ? 'bg-zinc-900 text-white shadow-[2px_2px_0_0_#4f46e5]' 
                    : 'bg-white text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Assignment Cards */}
        {filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((assignment: any) => {
              const sessions = assignment.quiz_sessions || [];
              const activeSession = sessions.find((s: any) => s.status === 'in_progress');
              const completedSessions = sessions.filter((s: any) => s.status === 'completed');
              const validSessions = sessions.filter((s: any) => ['in_progress', 'completed', 'abandoned'].includes(s.status));
              const attemptsCount = validSessions.length;
              const isExam = assignment.mode === 'exam';
              const effectiveMaxAttempts = isExam
                ? (assignment.max_attempts > 0 ? assignment.max_attempts : 1)
                : (assignment.max_attempts || 0);
              const isLocked = effectiveMaxAttempts > 0 && attemptsCount >= effectiveMaxAttempts && !activeSession;
              const bestScore = completedSessions.reduce((max: number, s: any) => Math.max(max, Number(s.score || 0)), 0);

              return (
                <div 
                  key={assignment.id} 
                  className={`border-2 border-zinc-900 p-5 flex flex-col justify-between gap-4 transition-all bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#18181b] ${
                    isLocked ? 'opacity-70 bg-zinc-50' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 border border-zinc-900 bg-zinc-100 text-zinc-700 truncate max-w-[200px]" title={assignment.class?.name}>
                        {assignment.class?.name || t('student.dashboard.course', 'KHÓA HỌC')}
                      </span>
                      {assignment.mode === 'adaptive' ? (
                        <span className="font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 bg-indigo-600 text-white border border-indigo-600 shrink-0 whitespace-nowrap">
                          {t('student.practice.adaptiveBadge', 'LUYỆN TẬP THÍCH ỨNG')}
                        </span>
                      ) : assignment.mode === 'exam' ? (
                        <span className="font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 bg-amber-600 text-white border border-amber-600 shrink-0 whitespace-nowrap">
                          {t('student.practice.examBadge', 'BÀI KIỂM TRA')}
                        </span>
                      ) : (
                        <span className="font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 bg-zinc-800 text-white border border-zinc-800 shrink-0 whitespace-nowrap">
                          {t('student.practice.standardBadge', 'TIÊU CHUẨN')}
                        </span>
                      )}
                      {attemptsCount > 0 && (
                        <span className="font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 bg-emerald-600 text-white shrink-0 whitespace-nowrap">
                          {t('student.dashboard.score', 'ĐIỂM')}: {bestScore}%
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black tracking-tight uppercase leading-snug break-words" title={assignment.title}>
                      {assignment.title}
                    </h3>

                    {assignment.deadline && (
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        {t('student.dashboard.deadline')}: {new Date(assignment.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      {assignment.time_limit ? `${assignment.time_limit} phút` : 'Không giới hạn tg'}
                      {effectiveMaxAttempts > 0 && ` • Lượt: ${attemptsCount}/${effectiveMaxAttempts}`}
                    </div>

                    {isLocked ? (
                      <span className="font-bold text-xs uppercase tracking-widest bg-zinc-200 border-2 border-zinc-900 px-4 py-2 text-zinc-600">
                        {t('student.dashboard.submitted', 'ĐÃ NỘP')}
                      </span>
                    ) : (
                      <Link
                        to={`/quiz?assignment=${assignment.id}`}
                        className="font-bold text-xs uppercase tracking-widest bg-zinc-900 text-white border-2 border-zinc-900 px-4 py-2 hover:bg-indigo-600 hover:border-indigo-600 transition-colors flex items-center gap-1 shadow-[2px_2px_0_0_#18181b]"
                      >
                        <span>{activeSession ? t('student.classDetail.continue', 'TIẾP TỤC') : attemptsCount > 0 ? t('student.dashboard.retry', 'LÀM LẠI') : t('student.dashboard.start', 'BẮT ĐẦU')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 border-2 border-dashed border-zinc-300 bg-zinc-50 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="font-bold text-zinc-500 uppercase tracking-widest text-sm">
              {t('student.practice.noAssignmentsFound', 'KHÔNG TÌM THẤY BÀI TẬP NÀO PHÙ HỢP')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeHub;

import React, { useState, useMemo } from 'react';
import { Layers, Search, X, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CurriculumLessonCard } from './CurriculumLessonCard';
import type { StudentCurriculum } from '../types/curriculum.types';

interface StudentCurriculumTabProps {
  curriculums: StudentCurriculum[];
  classId?: string;
}

export const StudentCurriculumTab: React.FC<StudentCurriculumTabProps> = ({
  curriculums,
  classId
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [contentFilter, setContentFilter] = useState<'all' | 'has_video' | 'has_materials' | 'has_assignments'>('all');

  const filteredCurriculums = useMemo(() => {
    let list = curriculums || [];

    // 1. Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((c) => {
        const titleMatch = c.title?.toLowerCase().includes(term);
        const contentMatch = c.content_html?.toLowerCase().includes(term);
        const materialMatch = c.materials?.some((m) => m.title?.toLowerCase().includes(term));
        const assignmentMatch = c.assignments?.some((ca) => ca.assignment?.title?.toLowerCase().includes(term));
        return titleMatch || contentMatch || materialMatch || assignmentMatch;
      });
    }

    // 2. Content Type filter
    if (contentFilter === 'has_video') {
      list = list.filter((c) => !!c.video_url);
    } else if (contentFilter === 'has_materials') {
      list = list.filter((c) => c.materials && c.materials.length > 0);
    } else if (contentFilter === 'has_assignments') {
      list = list.filter((c) => c.assignments && c.assignments.length > 0);
    }

    return list;
  }, [curriculums, searchTerm, contentFilter]);

  const hasActiveFilters = searchTerm.trim() !== '' || contentFilter !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setContentFilter('all');
  };

  return (
    <div className="space-y-8">
      {/* Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase text-zinc-900">
          {t('student.classDetail.curriculumRoadmap')}
        </h2>
        <div className="font-mono font-bold text-xs uppercase px-3 py-1.5 border-2 border-zinc-900 bg-indigo-50 text-indigo-900 w-fit">
          {t('student.classDetail.showingCount', { count: filteredCurriculums.length, total: curriculums.length })}
        </div>
      </div>

      {/* Search & Filter Toolbar (Visible when there are lessons) */}
      {curriculums.length > 0 && (
        <div className="border-4 border-zinc-900 bg-white p-5 shadow-[6px_6px_0_0_#18181b] space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('student.classDetail.searchCurriculumPlaceholder', 'TÌM KIẾM BÀI HỌC, TÀI LIỆU HOẶC BÀI TẬP...')}
                className="w-full pl-10 pr-9 py-2.5 text-xs font-bold uppercase tracking-wider border-2 border-zinc-900 bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-[2px_2px_0_0_#18181b]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills & Clear button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t-2 border-zinc-100">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: t('student.classDetail.filterAllCurriculums', 'TẤT CẢ BÀI HỌC') },
                { id: 'has_video', label: t('student.classDetail.filterHasVideo', 'CÓ VIDEO BÀI GIẢNG') },
                { id: 'has_materials', label: t('student.classDetail.filterHasMaterials', 'CÓ TÀI LIỆU') },
                { id: 'has_assignments', label: t('student.classDetail.filterHasAssignments', 'CÓ BÀI TẬP') },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setContentFilter(f.id as any)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-zinc-900 transition-all ${
                    contentFilter === f.id
                      ? 'bg-zinc-900 text-white shadow-[2px_2px_0_0_#4f46e5]'
                      : 'bg-white text-zinc-800 hover:bg-zinc-100 shadow-[2px_2px_0_0_#18181b]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700 underline px-2 py-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('student.classDetail.clearFilters', 'XÓA BỘ LỌC')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Curriculum List */}
      {filteredCurriculums.length > 0 ? (
        <div className="space-y-6">
          {filteredCurriculums.map((curriculum, index) => (
            <CurriculumLessonCard
              key={curriculum.id}
              curriculum={curriculum}
              index={index}
              classId={classId}
            />
          ))}
        </div>
      ) : curriculums.length > 0 ? (
        <div className="border-4 border-zinc-900 bg-white p-12 text-center shadow-[6px_6px_0_0_#18181b]">
          <div className="w-16 h-16 border-2 border-zinc-900 bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_0_#18181b]">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mb-2">
            {t('student.classDetail.noFilterResults', 'Không tìm thấy bài học nào')}
          </h3>
          <p className="text-zinc-600 font-medium max-w-md mx-auto mb-6">
            {t('student.classDetail.noFilterResultsDesc', 'Không có bài học nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.')}
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-6 py-3 bg-zinc-900 text-white font-black uppercase tracking-widest border-2 border-zinc-900 hover:bg-indigo-600 transition-colors shadow-[4px_4px_0_0_#18181b]"
          >
            {t('student.classDetail.clearFilters', 'Xóa bộ lọc')}
          </button>
        </div>
      ) : (
        <div className="border-4 border-zinc-900 bg-white p-12 text-center shadow-[6px_6px_0_0_#18181b]">
          <div className="w-16 h-16 border-2 border-zinc-900 bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_0_#18181b]">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mb-2">
            {t('student.classDetail.noCurriculums')}
          </h3>
          <p className="text-zinc-600 font-medium max-w-md mx-auto">
            {t('student.classDetail.noCurriculumsDesc')}
          </p>
        </div>
      )}
    </div>
  );
};

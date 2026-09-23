import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Sparkles,
  ArrowDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStudentCurriculumDetail } from '../hooks/useStudentCurriculumDetail';
import { CurriculumVideoPlayer } from './CurriculumVideoPlayer';
import { LessonMaterialsList } from './LessonMaterialsList';
import { LessonAssignmentsList } from './LessonAssignmentsList';
import { GoogleDocPreviewModal } from './GoogleDocPreviewModal';
import type { CurriculumMaterial } from '../types/curriculum.types';

export const StudentCurriculumDetailFeature: React.FC = () => {
  const { t } = useTranslation();
  const { classId, curriculumId } = useParams<{ classId: string; curriculumId: string }>();

  if (!classId || !curriculumId) return null;

  const {
    classData,
    assignments,
    curriculum,
    currentIndex,
    totalCount,
    prevCurriculum,
    nextCurriculum
  } = useStudentCurriculumDetail(classId, curriculumId);

  const [previewMaterial, setPreviewMaterial] = useState<CurriculumMaterial | null>(null);

  if (!curriculum) {
    return (
      <div className="border-4 border-zinc-900 bg-white p-12 text-center shadow-[6px_6px_0_0_#18181b]">
        <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mb-2">
          {t('student.classDetail.lessonNotFound')}
        </h3>
        <p className="text-zinc-600 font-medium max-w-md mx-auto mb-6">
          {t('student.classDetail.lessonNotFoundDesc')}
        </p>
        <Link
          to={`/student/classes/${classId}?tab=curriculum`}
          className="inline-flex items-center gap-2 font-mono font-bold text-xs uppercase px-5 py-3 border-2 border-zinc-900 bg-indigo-600 text-white shadow-[3px_3px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> {t('student.classDetail.backToClassCurriculum')}
        </Link>
      </div>
    );
  }

  const materialsCount = curriculum.materials?.length || 0;
  const assignmentsCount = curriculum.assignments?.length || 0;

  const readingTimeMinutes = useMemo(() => {
    if (!curriculum?.content_html) return 1;
    const words = curriculum.content_html
      .replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / 150));
  }, [curriculum?.content_html]);

  const sections = useMemo(() => {
    if (!curriculum?.content_html) return [];
    const regex = /<h3[^>]*>(.*?)<\/h3>/gi;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(curriculum.content_html)) !== null) {
      const cleanTitle = match[1].replace(/<[^>]+>/g, '').trim();
      if (cleanTitle) matches.push(cleanTitle);
    }
    return matches;
  }, [curriculum?.content_html]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Breadcrumb / Back Link */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to={`/student/classes/${classId}?tab=curriculum`}
          className="inline-flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-wider text-zinc-700 hover:text-indigo-600 px-3 py-2 border-2 border-zinc-900 bg-white shadow-[2px_2px_0_0_#18181b] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('student.classDetail.backToRoadmap', { name: classData?.name || 'Lớp học' })}</span>
        </Link>

        <div className="font-mono font-bold text-xs uppercase px-3 py-1.5 border-2 border-zinc-900 bg-zinc-100 text-zinc-800">
          {t('student.classDetail.lessonIndex', { current: currentIndex + 1, total: totalCount })}
        </div>
      </div>

      {/* Lesson Header Banner */}
      <div className="border-4 border-zinc-900 bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#18181b] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-12 h-12 border-2 border-zinc-900 bg-zinc-900 text-white flex items-center justify-center font-mono font-black text-lg shrink-0 shadow-[3px_3px_0_0_#4f46e5]">
              #{currentIndex + 1}
            </div>
            <div>
              <div className="font-mono font-bold text-xs uppercase tracking-widest text-indigo-600 mb-1">
                {classData?.name}
              </div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
                {curriculum.title}
              </h1>
            </div>
          </div>

          {/* Quick Meta Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {curriculum.video_url && (
              <span className="inline-flex items-center font-mono font-bold text-xs uppercase px-3 py-1.5 bg-red-100 text-red-900 border border-red-300">
                {t('student.classDetail.hasVideo')}
              </span>
            )}
            {materialsCount > 0 && (
              <span className="inline-flex items-center font-mono font-bold text-xs uppercase px-3 py-1.5 bg-blue-100 text-blue-900 border border-blue-300">
                {t('student.classDetail.materialsBadge', { count: materialsCount })}
              </span>
            )}
            {assignmentsCount > 0 && (
              <span className="inline-flex items-center font-mono font-bold text-xs uppercase px-3 py-1.5 bg-purple-100 text-purple-900 border border-purple-300">
                {t('student.classDetail.assignmentsBadge', { count: assignmentsCount })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        {/* Video Player */}
        {curriculum.video_url && (
          <div className="border-4 border-zinc-900 bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#18181b]">
            <CurriculumVideoPlayer
              videoUrl={curriculum.video_url}
              videoType={curriculum.video_type}
              title={curriculum.title}
            />
          </div>
        )}

        {/* HTML Lesson Content - Deep Reading Space */}
        {curriculum.content_html && (
          <div className="border-4 border-zinc-900 bg-white shadow-[6px_6px_0_0_#18181b] overflow-hidden">
            {/* Reading Header Banner */}
            <div className="bg-zinc-900 text-white p-5 md:p-6 flex flex-wrap items-center justify-between gap-4 border-b-4 border-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-white bg-indigo-600 text-white flex items-center justify-center font-bold shadow-[2px_2px_0_0_#ffffff]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-sm md:text-base uppercase tracking-wider text-white">
                    {t('student.classDetail.lessonContent', 'Nội dung bài giảng lý thuyết')}
                  </h3>
                  <p className="font-mono text-xs text-zinc-400">
                    {t('student.classDetail.theorySubtitle', 'Đọc kỹ lý thuyết và các ví dụ minh họa trước khi làm bài tập củng cố')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs uppercase px-3 py-1.5 bg-zinc-800 text-zinc-200 border-2 border-zinc-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {t('student.classDetail.readingTime', { minutes: readingTimeMinutes, defaultValue: `~${readingTimeMinutes} phút đọc` })}
                </span>
              </div>
            </div>

            {/* Quick TOC pills (if headings exist) */}
            {sections.length > 1 && (
              <div className="bg-zinc-50 border-b-2 border-zinc-200 p-4 px-6 md:px-8">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-zinc-500 mb-2">
                  <span>{t('student.classDetail.quickJump', 'Mục lục nhanh:')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sections.map((sec, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-xs font-semibold px-3 py-1 bg-white border-2 border-zinc-900 text-zinc-800 shadow-[2px_2px_0_0_#18181b]"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Body Rich Text with Enhanced Styles */}
            <div className="p-6 md:p-10">
              <div
                className="rich-text-content prose prose-zinc max-w-none text-zinc-900 leading-relaxed font-normal break-words prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase prose-h3:text-lg prose-h3:text-indigo-950 prose-h3:border-b-2 prose-h3:border-zinc-200 prose-h3:pb-2 prose-h3:mt-8 prose-h3:mb-4 prose-p:my-3 prose-ul:my-3 prose-li:my-1 prose-strong:text-zinc-950 prose-blockquote:border-l-4 prose-blockquote:border-indigo-600 prose-blockquote:bg-indigo-50/50 prose-blockquote:p-4 prose-blockquote:rounded-r-lg"
                dangerouslySetInnerHTML={{ __html: curriculum.content_html }}
              />

              {/* End of Theory CTA Banner (Jump to assignments) */}
              {assignmentsCount > 0 && (
                <div className="mt-10 p-6 md:p-8 border-4 border-zinc-900 bg-amber-50 shadow-[4px_4px_0_0_#18181b] flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 border-2 border-zinc-900 bg-amber-400 text-zinc-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#18181b]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-base md:text-lg uppercase tracking-tight text-zinc-900">
                        {t('student.classDetail.theoryDoneCtaTitle', 'Đã nắm vững lý thuyết bài này?')}
                      </h4>
                      <p className="text-xs md:text-sm text-zinc-700 font-medium mt-1">
                        {t('student.classDetail.theoryDoneCtaDesc', 'Hãy thử sức ngay với các bài tập củng cố bên dưới để ghi nhớ kiến thức sâu sắc hơn.')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('lesson-assignments')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase px-6 py-3.5 border-2 border-zinc-900 bg-indigo-600 text-white shadow-[3px_3px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                  >
                    <span>{t('student.classDetail.theoryDoneCtaBtn', 'Làm bài tập củng cố ngay')}</span>
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Materials */}
        {materialsCount > 0 && (
          <div className="border-4 border-zinc-900 bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#18181b]">
            <LessonMaterialsList
              materials={curriculum.materials}
              onSelectMaterial={setPreviewMaterial}
            />
          </div>
        )}

        {/* Assignments */}
        {assignmentsCount > 0 && (
          <div id="lesson-assignments" className="border-4 border-zinc-900 bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#18181b] scroll-mt-6">
            <LessonAssignmentsList
              curriculumAssignments={curriculum.assignments}
              allClassAssignments={assignments}
            />
          </div>
        )}
      </div>

      {/* Prev / Next Lesson Navigation Footer */}
      <div className="border-4 border-zinc-900 bg-white p-6 shadow-[6px_6px_0_0_#18181b] flex flex-col sm:flex-row items-center justify-between gap-4">
        {prevCurriculum ? (
          <Link
            to={`/student/classes/${classId}/curriculums/${prevCurriculum.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase px-5 py-3 border-2 border-zinc-900 bg-white hover:bg-zinc-100 text-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('student.classDetail.prevLesson', { title: prevCurriculum.title })}</span>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}

        <Link
          to={`/student/classes/${classId}?tab=curriculum`}
          className="text-xs font-mono font-bold uppercase text-zinc-500 hover:text-indigo-600 hover:underline"
        >
          {t('student.classDetail.lessonList')}
        </Link>

        {nextCurriculum ? (
          <Link
            to={`/student/classes/${classId}/curriculums/${nextCurriculum.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase px-5 py-3 border-2 border-zinc-900 bg-indigo-600 hover:bg-zinc-900 text-white shadow-[3px_3px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <span>{t('student.classDetail.nextLesson', { title: nextCurriculum.title })}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>

      {/* Google Preview Modal for Students */}
      <GoogleDocPreviewModal
        isOpen={!!previewMaterial}
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
      />
    </div>
  );
};

export default StudentCurriculumDetailFeature;

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStudentCurriculumDetail } from '../hooks/useStudentCurriculumDetail';
import { CurriculumVideoPlayer } from './CurriculumVideoPlayer';
import { LessonMaterialsList } from './LessonMaterialsList';
import { LessonAssignmentsList } from './LessonAssignmentsList';

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

        {/* HTML Lesson Content */}
        {curriculum.content_html && (
          <div className="border-4 border-zinc-900 bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#18181b] space-y-4">
            <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-widest text-zinc-500">
              <span>{t('student.classDetail.lessonContent')}</span>
            </div>
            <div
              className="p-6 md:p-8 border-2 border-zinc-900 bg-zinc-50/50 shadow-[4px_4px_0_0_#18181b] prose prose-zinc max-w-none text-zinc-800 leading-relaxed font-medium break-words"
              dangerouslySetInnerHTML={{ __html: curriculum.content_html }}
            />
          </div>
        )}

        {/* Materials */}
        {materialsCount > 0 && (
          <div className="border-4 border-zinc-900 bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#18181b]">
            <LessonMaterialsList materials={curriculum.materials} />
          </div>
        )}

        {/* Assignments */}
        {assignmentsCount > 0 && (
          <div className="border-4 border-zinc-900 bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#18181b]">
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
    </div>
  );
};

export default StudentCurriculumDetailFeature;

import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StudentCurriculum } from '../types/curriculum.types';

interface CurriculumLessonCardProps {
  curriculum: StudentCurriculum;
  index: number;
  classId?: string;
}

export const CurriculumLessonCard: React.FC<CurriculumLessonCardProps> = ({
  curriculum,
  index,
  classId: propClassId
}) => {
  const { t } = useTranslation();
  const { id: routeClassId } = useParams<{ id: string }>();
  const classId = propClassId || routeClassId;

  const materialsCount = curriculum.materials?.length || 0;
  const assignmentsCount = curriculum.assignments?.length || 0;

  // Extract clean plain text excerpt from content_html
  const previewExcerpt = useMemo(() => {
    if (!curriculum.content_html) return '';
    const plainText = curriculum.content_html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (plainText.length <= 150) return plainText;
    return plainText.substring(0, 150).trim() + '...';
  }, [curriculum.content_html]);

  const hasRichTheory = curriculum.content_html && curriculum.content_html.trim().length > 60;

  return (
    <Link
      to={`/student/classes/${classId}/curriculums/${curriculum.id}`}
      className="group block border-4 border-zinc-900 bg-white shadow-[6px_6px_0_0_#18181b] hover:shadow-[2px_2px_0_0_#18181b] hover:translate-x-[4px] hover:translate-y-[4px] transition-all p-6 md:p-8 select-none"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4 min-w-0">
          <div className="w-10 h-10 border-2 border-zinc-900 bg-zinc-900 text-white flex items-center justify-center font-mono font-black text-sm shrink-0 shadow-[2px_2px_0_0_#4f46e5]">
            #{index + 1}
          </div>

          <div className="min-w-0">
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 leading-tight group-hover:text-indigo-600 transition-colors">
              {curriculum.title}
            </h3>

            {previewExcerpt && (
              <p className="text-xs md:text-sm font-medium text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                {previewExcerpt}
              </p>
            )}

            {/* Quick Meta Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {hasRichTheory && (
                <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] uppercase px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <BookOpen className="w-3 h-3" />
                  {t('student.classDetail.hasTheory', 'Lý thuyết chi tiết')}
                </span>
              )}
              {curriculum.video_url && (
                <span className="inline-flex items-center font-mono font-bold text-[11px] uppercase px-2.5 py-1 bg-red-100 text-red-900 border border-red-300">
                  {t('student.classDetail.hasVideo')}
                </span>
              )}
              {materialsCount > 0 && (
                <span className="inline-flex items-center font-mono font-bold text-[11px] uppercase px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300">
                  {t('student.classDetail.materialsBadge', { count: materialsCount })}
                </span>
              )}
              {assignmentsCount > 0 && (
                <span className="inline-flex items-center font-mono font-bold text-[11px] uppercase px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300">
                  {t('student.classDetail.assignmentsBadge', { count: assignmentsCount })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center font-mono font-bold text-xs uppercase text-indigo-600">
          <span className="group-hover:underline">{t('student.classDetail.enterLesson')}</span>
          <div className="w-9 h-9 border-2 border-zinc-900 bg-indigo-600 text-white flex items-center justify-center shadow-[2px_2px_0_0_#18181b] group-hover:bg-zinc-900 transition-colors">
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
};

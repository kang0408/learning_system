import React from 'react';
import {
  X,
  Video,
  FileText,
  BookOpen,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ClassCurriculum } from '../types/curriculum.types';

interface CurriculumDetailModalProps {
  curriculum: ClassCurriculum | null;
  onClose: () => void;
  onEdit?: (curriculum: ClassCurriculum) => void;
}

export const CurriculumDetailModal: React.FC<CurriculumDetailModalProps> = ({
  curriculum,
  onClose,
  onEdit
}) => {
  const { t } = useTranslation();

  if (!curriculum) return null;

  const renderVideoPlayer = (url?: string | null, type?: string | null) => {
    if (!url) return null;

    if (type === 'direct') {
      return (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-md border border-slate-800">
          <video
            src={url}
            controls
            className="w-full h-full object-contain"
            playsInline
          />
        </div>
      );
    }

    return (
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-md border border-slate-800">
        <iframe
          src={url}
          title={curriculum.title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  };

  const getModeLabel = (mode?: string) => {
    switch (mode) {
      case 'adaptive':
        return t('teacher.classDetail.adaptiveMode');
      case 'exam':
        return t('teacher.classDetail.examMode');
      case 'standard':
      default:
        return t('teacher.classDetail.standardMode');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Badge variant="indigo" size="md" className="shrink-0">
              {t('teacher.classDetail.lessonNumber', { number: curriculum.order_index + 1 })}
            </Badge>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {curriculum.title}
            </h2>
            {curriculum.is_published ? (
              <Badge variant="success" size="sm" className="shrink-0 hidden sm:inline-flex">
                {t('teacher.classDetail.published')}
              </Badge>
            ) : (
              <Badge variant="secondary" size="sm" className="shrink-0 hidden sm:inline-flex bg-amber-100 text-amber-800 border-amber-200">
                {t('teacher.classDetail.draft')}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(curriculum);
                }}
                className="hidden sm:inline-flex"
              >
                {t('teacher.classDetail.edit')}
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Video Section */}
          {curriculum.video_url && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-red-500" /> {t('teacher.classDetail.videoLecture')}
              </h4>
              {renderVideoPlayer(curriculum.video_url, curriculum.video_type)}
            </div>
          )}

          {/* HTML Content */}
          {curriculum.content_html && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('teacher.classDetail.lessonContent')}
              </h4>
              <div
                className="rich-text-content prose prose-sm sm:prose-base max-w-none text-slate-700 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-100 leading-relaxed break-words"
                dangerouslySetInnerHTML={{ __html: curriculum.content_html }}
              />
            </div>
          )}

          {/* Materials Section */}
          {curriculum.materials && curriculum.materials.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" /> {t('teacher.classDetail.attachedMaterials')} ({curriculum.materials.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {curriculum.materials.map((mat, idx) => (
                  <a
                    key={idx}
                    href={mat.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                          {mat.title}
                        </div>
                        {mat.file_type && (
                          <div className="text-xs text-slate-400 uppercase font-medium">
                            {mat.file_type} {mat.file_size ? `• ${(mat.file_size / 1024).toFixed(0)} KB` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Assignments Section */}
          {curriculum.assignments && curriculum.assignments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-500" /> {t('teacher.classDetail.curriculumAssignments')} ({curriculum.assignments.length})
              </h4>
              <div className="space-y-2">
                {curriculum.assignments.map((item, idx) => {
                  const assign = item.assignment;
                  if (!assign) return null;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50/40 border border-purple-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {assign.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-medium">
                              {t('teacher.classDetail.mode')}: {getModeLabel(assign.mode)}
                            </span>
                            {assign._count?.assignment_questions !== undefined && (
                              <span>• {t('teacher.classDetail.questionsCountUnit', { count: assign._count.assignment_questions })}</span>
                            )}
                            {assign.time_limit && (
                              <span>• {t('teacher.classDetail.timeLimitUnit', { count: assign.time_limit })}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={assign.mode === 'standard' ? 'indigo' : assign.mode === 'adaptive' ? 'secondary' : 'warning'}
                        size="sm"
                        className="shrink-0"
                      >
                        {getModeLabel(assign.mode)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end bg-slate-50 shrink-0">
          <Button variant="outline" size="md" onClick={onClose}>
            {t('student.menu.close')}
          </Button>
        </div>
      </div>
    </div>
  );
};

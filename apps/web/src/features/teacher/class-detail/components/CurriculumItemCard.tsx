import React from 'react';
import {
  GripVertical,
  Video,
  FileText,
  BookOpen,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ClassCurriculum } from '../types/curriculum.types';

interface CurriculumItemCardProps {
  curriculum: ClassCurriculum;
  index: number;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onPreview: (curriculum: ClassCurriculum) => void;
  onEdit: (curriculum: ClassCurriculum) => void;
  onDelete: (curriculum: ClassCurriculum) => void;
}

export const CurriculumItemCard: React.FC<CurriculumItemCardProps> = ({
  curriculum,
  index,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onPreview,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();
  const materialsCount = curriculum.materials?.length || 0;
  const assignmentsCount = curriculum.assignments?.length || 0;

  const getVideoSourceLabel = (type?: string | null) => {
    switch (type) {
      case 'drive':
        return 'Google Drive';
      case 'youtube':
        return 'YouTube';
      case 'vimeo':
        return 'Vimeo';
      case 'direct':
        return 'MP4 Video';
      default:
        return 'Video';
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative bg-white border rounded-2xl p-4 sm:p-5 transition-all duration-200 ${
        isDragging
          ? 'opacity-40 scale-[0.99] border-dashed border-indigo-400 bg-indigo-50/40 shadow-none'
          : isDragOver
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md translate-y-[-2px]'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Drag Handle */}
        <div
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors mt-0.5"
          title={t('teacher.classDetail.reorderHint')}
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Number Index */}
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs shrink-0 shadow-sm">
          #{index + 1}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-base font-bold text-slate-900 truncate tracking-tight hover:text-indigo-600 transition-colors">
              {curriculum.title}
            </h3>

            {curriculum.is_published ? (
              <Badge variant="success" size="sm">
                {t('teacher.classDetail.published')}
              </Badge>
            ) : (
              <Badge variant="secondary" size="sm" className="bg-amber-100 text-amber-800 border-amber-200">
                {t('teacher.classDetail.draft')}
              </Badge>
            )}
          </div>

          {/* Meta Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 font-medium mt-2">
            {curriculum.video_url && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-100">
                <Video className="w-3.5 h-3.5" />
                <span>{getVideoSourceLabel(curriculum.video_type)}</span>
              </span>
            )}

            {materialsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                <FileText className="w-3.5 h-3.5" />
                <span>{t('teacher.classDetail.materialsCount', { count: materialsCount })}</span>
              </span>
            )}

            {assignmentsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('teacher.classDetail.assignmentsCount', { count: assignmentsCount })}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPreview(curriculum)}
            className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 h-auto"
            title={t('teacher.classDetail.viewLesson')}
          >
            <Eye className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(curriculum)}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-2 h-auto"
            title={t('teacher.classDetail.editLesson')}
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(curriculum)}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 h-auto"
            title={t('teacher.classDetail.deleteLesson')}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

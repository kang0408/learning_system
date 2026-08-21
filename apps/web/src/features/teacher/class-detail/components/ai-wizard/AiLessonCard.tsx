import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit2,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileQuestion,
  Layers,
  BookOpen,
} from 'lucide-react';
import type { WizardLesson } from '../../types/aiWizard.types';

interface AiLessonCardProps {
  lesson: WizardLesson;
  index: number;
  total: number;
  onUpdate: (tempId: string, title: string, summary?: string, pageRange?: string) => void;
  onDelete: (tempId: string) => void;
  onOpenDetail: (tempId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRetry: (tempId: string) => void;
  isGeneratingAll?: boolean;
}

export const AiLessonCard: React.FC<AiLessonCardProps> = ({
  lesson,
  index,
  total,
  onUpdate,
  onDelete,
  onOpenDetail,
  onMoveUp,
  onMoveDown,
  onRetry,
  isGeneratingAll = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(lesson.title);
  const [editSummary, setEditSummary] = useState(lesson.summary || '');
  const [editPageRange, setEditPageRange] = useState(lesson.page_range || '');

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdate(lesson.temp_id, editTitle.trim(), editSummary.trim(), editPageRange.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(lesson.title);
    setEditSummary(lesson.summary || '');
    setEditPageRange(lesson.page_range || '');
    setIsEditing(false);
  };

  // Status-based styling
  const getStatusBadge = () => {
    switch (lesson.status) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Đang sinh câu hỏi...
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lesson.questions_count} câu hỏi • {lesson.topics_count} chủ đề
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <AlertCircle className="w-3.5 h-3.5" />
            Lỗi phân tích
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
            <Layers className="w-3.5 h-3.5" />
            Chờ tạo nội dung
          </span>
        );
    }
  };

  return (
    <div
      className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-sm ${
        lesson.status === 'processing'
          ? 'border-indigo-400 ring-2 ring-indigo-500/10'
          : lesson.status === 'ready'
          ? 'border-emerald-200 hover:border-emerald-300'
          : lesson.status === 'error'
          ? 'border-rose-200'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Index & Content */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Order Controls & Drag Icon */}
          <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
            <button
              type="button"
              disabled={index === 0 || isGeneratingAll}
              onClick={() => onMoveUp(index)}
              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
              {index + 1}
            </span>
            <button
              type="button"
              disabled={index === total - 1 || isGeneratingAll}
              onClick={() => onMoveDown(index)}
              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Lesson Info / Edit Form */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {!isEditing ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {lesson.title}
                  </h4>
                  {lesson.page_range && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      <BookOpen className="w-3 h-3" />
                      Trang {lesson.page_range}
                    </span>
                  )}
                  {getStatusBadge()}
                </div>
                {lesson.summary && (
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">
                    {lesson.summary}
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Tiêu đề bài học"
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <textarea
                  rows={2}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  placeholder="Tóm tắt nội dung bài học"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editPageRange}
                    onChange={(e) => setEditPageRange(e.target.value)}
                    placeholder="Khoảng trang (VD: 5-18)"
                    className="w-40 text-xs border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 shrink-0">
            {lesson.status === 'ready' && (
              <button
                type="button"
                onClick={() => onOpenDetail(lesson.temp_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl transition-colors shadow-sm"
              >
                <FileQuestion className="w-3.5 h-3.5" />
                <span>Xem & Sửa Câu Hỏi</span>
              </button>
            )}

            {lesson.status === 'error' && (
              <button
                type="button"
                onClick={() => onRetry(lesson.temp_id)}
                disabled={isGeneratingAll}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isGeneratingAll}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(lesson.temp_id)}
              disabled={isGeneratingAll}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mini Progress Bar when processing */}
      {lesson.status === 'processing' && (
        <div className="mt-3 w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

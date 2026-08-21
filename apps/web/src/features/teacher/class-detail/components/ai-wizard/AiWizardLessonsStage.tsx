import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Layers,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AiLessonCard } from './AiLessonCard';
import type { WizardLesson } from '../../types/aiWizard.types';

interface AiWizardLessonsStageProps {
  curriculumTitle: string;
  curriculumDescription: string;
  onUpdateHeader: (title: string, description: string) => void;
  lessons: WizardLesson[];
  onUpdateLessons: (lessons: WizardLesson[]) => void;
  onOpenDetailModal: (lessonTempId: string) => void;
  onStartBatchGen: (lessonTempIds?: string[]) => void;
  isGenerating: boolean;
  overallProgress: number;
  onCommit: () => void;
  isCommitting: boolean;
  onDiscardDraft: () => void;
  isDiscarding: boolean;
}

export const AiWizardLessonsStage: React.FC<AiWizardLessonsStageProps> = ({
  curriculumTitle,
  curriculumDescription,
  onUpdateHeader,
  lessons,
  onUpdateLessons,
  onOpenDetailModal,
  onStartBatchGen,
  isGenerating,
  overallProgress,
  onCommit,
  isCommitting,
  onDiscardDraft,
  isDiscarding,
}) => {
  const { t } = useTranslation();
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newPageRange, setNewPageRange] = useState('');

  // Reorder helpers
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...lessons];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    // update order_index
    const reindexed = updated.map((l, idx) => ({ ...l, order_index: idx + 1 }));
    onUpdateLessons(reindexed);
  };

  const handleMoveDown = (index: number) => {
    if (index === lessons.length - 1) return;
    const updated = [...lessons];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    const reindexed = updated.map((l, idx) => ({ ...l, order_index: idx + 1 }));
    onUpdateLessons(reindexed);
  };

  const handleUpdateCard = (
    tempId: string,
    title: string,
    summary?: string,
    pageRange?: string
  ) => {
    const updated = lessons.map((l) =>
      l.temp_id === tempId ? { ...l, title, summary, page_range: pageRange } : l
    );
    onUpdateLessons(updated);
  };

  const handleDeleteCard = (tempId: string) => {
    const lessonToDelete = lessons.find((l) => l.temp_id === tempId);
    const confirmMessage = t(
      'teacher.aiWizard.lessonsStage.deleteLessonConfirm',
      `Bạn có chắc chắn muốn xóa bài học "${lessonToDelete?.title || ''}" khỏi lộ trình?`
    );
    if (!window.confirm(confirmMessage)) return;

    const filtered = lessons
      .filter((l) => l.temp_id !== tempId)
      .map((l, idx) => ({ ...l, order_index: idx + 1 }));
    onUpdateLessons(filtered);
  };

  const handleAddLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newLesson: WizardLesson = {
      temp_id: `lesson_${Date.now()}`,
      title: newTitle.trim(),
      summary: newSummary.trim(),
      order_index: lessons.length + 1,
      page_range: newPageRange.trim(),
      status: 'pending',
      topics_count: 0,
      questions_count: 0,
    };

    onUpdateLessons([...lessons, newLesson]);
    setNewTitle('');
    setNewSummary('');
    setNewPageRange('');
    setIsAddingLesson(false);
  };

  const readyCount = lessons.filter((l) => l.status === 'ready').length;
  const canCommit = readyCount > 0 && !isGenerating;

  const errorLessons = lessons.filter((l) => l.status === 'error');

  return (
    <div className="space-y-6">
      {/* Header Info Edit */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {t('teacher.aiWizard.lessonsStage.headerInfo')}
          </label>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
            {t('teacher.aiWizard.lessonsStage.lessonsCount', { count: lessons.length })}
          </span>
        </div>
        <input
          type="text"
          value={curriculumTitle}
          onChange={(e) => onUpdateHeader(e.target.value, curriculumDescription)}
          placeholder={t('teacher.aiWizard.lessonsStage.curriculumTitlePlaceholder')}
          className="w-full text-base sm:text-lg font-bold text-slate-900 bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <input
          type="text"
          value={curriculumDescription}
          onChange={(e) => onUpdateHeader(curriculumTitle, e.target.value)}
          placeholder={t('teacher.aiWizard.lessonsStage.curriculumDescPlaceholder')}
          className="w-full text-xs sm:text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Cards List Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t('teacher.aiWizard.lessonsStage.lessonsListTitle')}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
            {t('teacher.aiWizard.lessonsStage.readyStatus', { ready: readyCount, total: lessons.length })}
          </span>
          {errorLessons.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full">
              {t('teacher.aiWizard.lessonsStage.errorStatus', { count: errorLessons.length })}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {errorLessons.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartBatchGen(errorLessons.map((l) => l.temp_id))}
              disabled={isGenerating}
              className="text-xs border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              {t('teacher.aiWizard.lessonsStage.retryErrorLessons', { count: errorLessons.length })}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingLesson(true)}
            disabled={isGenerating}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {t('teacher.aiWizard.lessonsStage.addLessonBtn')}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onStartBatchGen()}
            disabled={isGenerating || lessons.length === 0}
            className="text-xs shadow-md shadow-indigo-100"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                {t('teacher.aiWizard.lessonsStage.generatingProgress', { percent: overallProgress })}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                {t('teacher.aiWizard.lessonsStage.generateAllBtn')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overall Progress Bar during batch generation */}
      {isGenerating && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              {t('teacher.aiWizard.lessonsStage.generatingParallel')}
            </span>
            <span>{overallProgress}%</span>
          </div>
          <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Add New Lesson Inline Form */}
      {isAddingLesson && (
        <form
          onSubmit={handleAddLessonSubmit}
          className="bg-indigo-50/40 border border-indigo-200 rounded-2xl p-4 space-y-3"
        >
          <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
            {t('teacher.aiWizard.lessonsStage.addNewLessonTitle')}
          </h5>
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('teacher.aiWizard.lessonsStage.lessonTitlePlaceholder')}
            className="w-full text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <textarea
            rows={2}
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            placeholder={t('teacher.aiWizard.lessonsStage.lessonSummaryPlaceholder')}
            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={newPageRange}
              onChange={(e) => setNewPageRange(e.target.value)}
              placeholder={t('teacher.aiWizard.lessonsStage.pageRangePlaceholder')}
              className="w-48 text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" size="sm" className="text-xs">
                {t('teacher.aiWizard.lessonsStage.saveLessonBtn')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingLesson(false)}
                className="text-xs"
              >
                {t('teacher.aiWizard.lessonsStage.cancelBtn')}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Lessons List */}
      <div className="space-y-3">
        {lessons.map((lesson, idx) => (
          <AiLessonCard
            key={lesson.temp_id}
            lesson={lesson}
            index={idx}
            total={lessons.length}
            onUpdate={handleUpdateCard}
            onDelete={handleDeleteCard}
            onOpenDetail={onOpenDetailModal}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onRetry={(tempId) => onStartBatchGen([tempId])}
            isGeneratingAll={isGenerating}
          />
        ))}

        {lessons.length === 0 && (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              {t('teacher.aiWizard.lessonsStage.noLessonsInStage')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingLesson(true)}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t('teacher.aiWizard.lessonsStage.addFirstLesson')}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onDiscardDraft}
          disabled={isDiscarding || isCommitting || isGenerating}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('teacher.aiWizard.lessonsStage.discardAll')}</span>
        </button>

        <Button
          variant="primary"
          size="md"
          onClick={onCommit}
          disabled={!canCommit || isCommitting}
          className="w-full sm:w-auto shadow-md shadow-indigo-100"
        >
          {isCommitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('teacher.aiWizard.lessonsStage.commitSaving')}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t('teacher.aiWizard.lessonsStage.commitSaveBtn', { count: readyCount })}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};


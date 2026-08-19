import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, type SelectOption } from '@/components/ui/Select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type {
  ClassCurriculum,
  CreateCurriculumPayload,
  UpdateCurriculumPayload,
  CurriculumMaterial
} from '../types/curriculum.types';

const FILE_TYPE_OPTIONS: SelectOption[] = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOCX', value: 'docx' },
  { label: 'PPTX', value: 'pptx' },
  { label: 'ZIP', value: 'zip' },
  { label: 'LINK', value: 'link' },
];

interface CurriculumFormModalProps {
  initialData?: ClassCurriculum | null;
  availableAssignments: any[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCurriculumPayload | UpdateCurriculumPayload) => Promise<void>;
}

export const CurriculumFormModal: React.FC<CurriculumFormModalProps> = ({
  initialData,
  availableAssignments,
  isSubmitting,
  onClose,
  onSubmit
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;

  const [title, setTitle] = useState(initialData?.title || '');
  const [contentHtml, setContentHtml] = useState(initialData?.content_html || '');
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url || '');
  const [videoType, setVideoType] = useState<string>(initialData?.video_type || 'drive');
  const [isPublished, setIsPublished] = useState<boolean>(initialData ? initialData.is_published : true);
  const [materials, setMaterials] = useState<CurriculumMaterial[]>(
    initialData?.materials?.map(m => ({
      title: m.title,
      file_url: m.file_url,
      file_type: m.file_type || 'pdf',
      file_size: m.file_size || 0
    })) || []
  );
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(
    initialData?.assignments?.map(a => a.assignment_id) || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-detect video type from URL
  useEffect(() => {
    if (!videoUrl) return;
    if (videoUrl.includes('drive.google.com')) {
      setVideoType('drive');
    } else if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      setVideoType('youtube');
    } else if (videoUrl.includes('vimeo.com')) {
      setVideoType('vimeo');
    } else {
      setVideoType('direct');
    }
  }, [videoUrl]);

  // Materials dynamic row handlers
  const handleAddMaterial = () => {
    setMaterials(prev => [
      ...prev,
      { title: '', file_url: '', file_type: 'pdf', file_size: 0 }
    ]);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, field: keyof CurriculumMaterial, value: any) => {
    setMaterials(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Assignment checkbox toggle
  const handleToggleAssignment = (assignmentId: string) => {
    setSelectedAssignmentIds(prev =>
      prev.includes(assignmentId)
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = t('teacher.classDetail.lessonTitleRequired');
    if (!contentHtml.trim()) newErrors.contentHtml = t('teacher.classDetail.lessonContentRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Filter valid materials
    const validMaterials = materials
      .filter(m => m.title.trim() && m.file_url.trim())
      .map((m, idx) => ({
        title: m.title.trim(),
        file_url: m.file_url.trim(),
        file_type: m.file_type || 'pdf',
        file_size: Number(m.file_size) || 0,
        order_index: idx
      }));

    const payload: CreateCurriculumPayload = {
      title: title.trim(),
      content_html: contentHtml,
      video_url: videoUrl.trim() || null,
      video_type: videoUrl.trim() ? videoType : null,
      is_published: isPublished,
      materials: validMaterials,
      assignment_ids: selectedAssignmentIds
    };

    await onSubmit(payload);
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEdit ? t('teacher.classDetail.formEditTitle') : t('teacher.classDetail.formCreateTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t('teacher.classDetail.formSubtitle')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* 1. Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('teacher.classDetail.lessonTitleLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                  }}
                  placeholder={t('teacher.classDetail.lessonTitlePlaceholder')}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm font-medium ${
                    errors.title ? 'border-red-400' : 'border-slate-200'
                  }`}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1 font-medium">{errors.title}</p>}
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={isPublished}
                  onChange={e => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="is_published" className="text-sm font-semibold text-slate-800 cursor-pointer select-none">
                  {t('teacher.classDetail.publishLessonCheckbox')}
                </label>
              </div>
            </div>

            {/* 2. Video bài giảng */}
            <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800">
                  {t('teacher.classDetail.videoSectionTitle')}
                </label>
                {videoType && videoUrl && (
                  <Badge variant="secondary" size="sm" className="capitalize">
                    {videoType}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder={t('teacher.classDetail.videoPlaceholder')}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>
              <p className="text-xs text-slate-500">
                {t('teacher.classDetail.videoTip')}
              </p>
            </div>

            {/* 3. Nội dung bài học (Rich Text Editor) */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                {t('teacher.classDetail.lessonContent')} <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={contentHtml}
                onChange={html => {
                  setContentHtml(html);
                  if (errors.contentHtml) setErrors(prev => ({ ...prev, contentHtml: '' }));
                }}
                placeholder={t('teacher.classDetail.contentPlaceholder')}
                error={!!errors.contentHtml}
                minHeight="200px"
              />
              {errors.contentHtml && <p className="text-xs text-red-500 font-medium">{errors.contentHtml}</p>}
            </div>

            {/* 4. Materials Dynamic List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800">
                  {t('teacher.classDetail.attachedMaterials')} ({materials.length})
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMaterial}
                  className="text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> {t('teacher.classDetail.addMaterialBtn')}
                </Button>
              </div>

              {materials.length === 0 ? (
                <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  {t('teacher.classDetail.noMaterials')}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {materials.map((mat, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        placeholder={t('teacher.classDetail.materialTitlePlaceholder')}
                        value={mat.title}
                        onChange={e => handleMaterialChange(idx, 'title', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder={t('teacher.classDetail.materialUrlPlaceholder')}
                        value={mat.file_url}
                        onChange={e => handleMaterialChange(idx, 'file_url', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="w-28 shrink-0">
                        <Select
                          value={mat.file_type || 'pdf'}
                          onChange={val => handleMaterialChange(idx, 'file_type', val)}
                          options={FILE_TYPE_OPTIONS}
                          size="sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Assignment Selector */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-800">
                {t('teacher.classDetail.curriculumAssignments')} ({selectedAssignmentIds.length})
              </label>

              {(() => {
                const publishedAssignments = (availableAssignments || []).filter(a => a.is_published);
                return publishedAssignments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {publishedAssignments.map(assign => {
                      const isChecked = selectedAssignmentIds.includes(assign.id);
                      return (
                        <div
                          key={assign.id}
                          onClick={() => handleToggleAssignment(assign.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-purple-50/80 border-purple-300 ring-1 ring-purple-400/30'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {assign.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {t('teacher.classDetail.mode')}: {getModeLabel(assign.mode)}
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    {t('teacher.classDetail.noPublishedAssignments')}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('teacher.classDetail.cancelBtn')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('teacher.classDetail.savingBtn')
                : isEdit
                ? t('teacher.classDetail.saveChangesBtn')
                : t('teacher.classDetail.createBtn')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

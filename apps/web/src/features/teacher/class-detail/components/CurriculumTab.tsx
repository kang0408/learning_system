import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Layers,
  GripVertical,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/utils/toast';

import { useCurriculums, useCurriculumMutations } from '../hooks/useCurriculumData';
import { teacherAiWizardApi } from '../api/teacherAiWizardApi';
import { DraggableCurriculumList } from './DraggableCurriculumList';
import { CurriculumFormModal } from './CurriculumFormModal';
import { CurriculumDetailModal } from './CurriculumDetailModal';
import { DeleteCurriculumModal } from './DeleteCurriculumModal';
import { AiWizardModal } from './ai-wizard/AiWizardModal';
import { AiWizardResumeBanner } from './ai-wizard/AiWizardResumeBanner';
import type {
  ClassCurriculum,
  CreateCurriculumPayload,
  UpdateCurriculumPayload,
  ReorderCurriculumItem,
} from '../types/curriculum.types';

interface CurriculumTabProps {
  classId: string;
  assignments: any[];
}

export const CurriculumTab: React.FC<CurriculumTabProps> = ({ classId, assignments }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: curriculums = [], isLoading, isError } = useCurriculums(classId);
  const {
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    reorderCurriculums,
  } = useCurriculumMutations(classId);

  // Active Draft query
  const { data: activeDraft } = useQuery({
    queryKey: ['ai-wizard-draft', classId],
    queryFn: () => teacherAiWizardApi.getActiveDraft(classId),
    enabled: !!classId,
  });

  const discardDraftMutation = useMutation({
    mutationFn: () => teacherAiWizardApi.deleteDraft(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-wizard-draft', classId] });
      toast.success('Đã hủy bản nháp AI thành công');
    },
  });

  const [showAiWizardModal, setShowAiWizardModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<ClassCurriculum | null>(null);
  const [previewCurriculum, setPreviewCurriculum] = useState<ClassCurriculum | null>(null);
  const [deletingCurriculum, setDeletingCurriculum] = useState<ClassCurriculum | null>(null);

  const publishedCount = curriculums.filter((c) => c.is_published).length;

  const handleOpenCreate = () => {
    setEditingCurriculum(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (curriculum: ClassCurriculum) => {
    setEditingCurriculum(curriculum);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (payload: CreateCurriculumPayload | UpdateCurriculumPayload) => {
    try {
      if (editingCurriculum) {
        await updateCurriculum.mutateAsync({
          id: editingCurriculum.id,
          payload: payload as UpdateCurriculumPayload,
        });
        toast.success(t('teacher.classDetail.updateLessonSuccess'));
      } else {
        await createCurriculum.mutateAsync(payload as CreateCurriculumPayload);
        toast.success(t('teacher.classDetail.createLessonSuccess'));
      }
      setShowFormModal(false);
      setEditingCurriculum(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.classMembers.errorGeneric'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCurriculum) return;
    try {
      await deleteCurriculum.mutateAsync(deletingCurriculum.id);
      toast.success(t('teacher.classDetail.deleteLessonSuccess'));
      setDeletingCurriculum(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.classMembers.errorGeneric'));
    }
  };

  const handleReorder = (orders: ReorderCurriculumItem[]) => {
    reorderCurriculums.mutate(orders, {
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || t('teacher.classMembers.errorGeneric'));
      },
    });
  };

  const handleDiscardDraft = () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy bản nháp AI này?')) {
      discardDraftMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-500">{t('teacher.classDetail.loading')}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center text-red-600">
        <p className="font-bold">{t('teacher.classMembers.errorGeneric')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resume Draft Banner */}
      {activeDraft && (
        <AiWizardResumeBanner
          draft={activeDraft}
          onResume={() => setShowAiWizardModal(true)}
          onDiscard={handleDiscardDraft}
          isDiscarding={discardDraftMutation.isPending}
        />
      )}

      {/* Top Banner / Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" /> {t('teacher.classDetail.curriculumTab')}
            </h2>
            <Badge variant="indigo" size="sm">
              {curriculums.length}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t('teacher.classDetail.reorderHint')} • {publishedCount} {t('teacher.classDetail.published')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowAiWizardModal(true)}
            className="flex-1 sm:flex-initial text-indigo-600 border-indigo-200 hover:bg-indigo-50/60 shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" />
            Tạo bằng AI
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial shrink-0 shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4 mr-1.5" /> {t('teacher.classDetail.addLesson')}
          </Button>
        </div>
      </div>

      {/* Curriculum List or Empty State */}
      {curriculums.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {t('teacher.classDetail.noLessons')}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {t('teacher.classDetail.noLessonsDesc')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowAiWizardModal(true)}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Tạo tự động bằng AI
            </Button>
            <Button variant="primary" size="md" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> {t('teacher.classDetail.addLesson')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5" /> {t('teacher.classDetail.reorderHint')}
            </span>
            <span>{curriculums.length}</span>
          </div>

          <DraggableCurriculumList
            curriculums={curriculums}
            onReorder={handleReorder}
            onPreview={(curriculum) => setPreviewCurriculum(curriculum)}
            onEdit={handleOpenEdit}
            onDelete={(curriculum) => setDeletingCurriculum(curriculum)}
          />
        </div>
      )}

      {/* Modals */}
      {showAiWizardModal && (
        <AiWizardModal
          classId={classId}
          onClose={() => setShowAiWizardModal(false)}
        />
      )}

      {showFormModal && (
        <CurriculumFormModal
          initialData={editingCurriculum}
          availableAssignments={assignments}
          isSubmitting={createCurriculum.isPending || updateCurriculum.isPending}
          onClose={() => {
            setShowFormModal(false);
            setEditingCurriculum(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {previewCurriculum && (
        <CurriculumDetailModal
          curriculum={previewCurriculum}
          onClose={() => setPreviewCurriculum(null)}
          onEdit={handleOpenEdit}
        />
      )}

      {deletingCurriculum && (
        <DeleteCurriculumModal
          curriculum={deletingCurriculum}
          isDeleting={deleteCurriculum.isPending}
          onClose={() => setDeletingCurriculum(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import type { ClassCurriculum } from '../types/curriculum.types';

interface DeleteCurriculumModalProps {
  curriculum: ClassCurriculum | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteCurriculumModal: React.FC<DeleteCurriculumModalProps> = ({
  curriculum,
  isDeleting,
  onClose,
  onConfirm
}) => {
  const { t } = useTranslation();

  if (!curriculum) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full relative animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t('teacher.classDetail.deleteCurriculumTitle')}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            {t('teacher.classDetail.deleteCurriculumDesc', { title: curriculum.title })}
          </p>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50">
          <Button variant="outline" size="md" onClick={onClose} disabled={isDeleting}>
            {t('teacher.classDetail.cancelBtn')}
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirm}
            disabled={isDeleting}
            isLoading={isDeleting}
          >
            {isDeleting ? t('teacher.classDetail.deletingBtn') : t('teacher.classDetail.deleteCurriculumConfirmBtn')}
          </Button>
        </div>
      </div>
    </div>
  );
};

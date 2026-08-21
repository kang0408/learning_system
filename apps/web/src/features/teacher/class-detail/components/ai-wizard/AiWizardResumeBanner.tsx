import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { WizardDraft } from '../../types/aiWizard.types';

interface AiWizardResumeBannerProps {
  draft: WizardDraft;
  onResume: () => void;
  onDiscard: () => void;
  isDiscarding?: boolean;
}

export const AiWizardResumeBanner: React.FC<AiWizardResumeBannerProps> = ({
  draft,
  onResume,
  onDiscard,
  isDiscarding = false,
}) => {
  const { t } = useTranslation();
  const lessonCount = draft.payload?.lessons?.length || 0;
  const draftTitle = draft.payload?.curriculum_title || t('teacher.aiWizard.resumeBanner.defaultDraftTitle');

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {t('teacher.aiWizard.resumeBanner.incompleteDraftTitle', { title: draftTitle })}
            </h4>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100/70 text-indigo-700">
              {t('teacher.aiWizard.resumeBanner.lessonCount', { count: lessonCount })}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {t('teacher.aiWizard.resumeBanner.desc')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          disabled={isDiscarding}
          onClick={onDiscard}
          className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5 inline mr-1" />
          {t('teacher.aiWizard.resumeBanner.discardDraft')}
        </button>

        <Button
          variant="primary"
          size="sm"
          onClick={onResume}
          className="shadow-sm shadow-indigo-100 text-xs"
        >
          {t('teacher.aiWizard.resumeBanner.resume')}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    </div>
  );
};


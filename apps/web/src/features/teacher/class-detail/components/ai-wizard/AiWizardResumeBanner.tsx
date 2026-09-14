import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Trash2, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { WizardDraft } from '../../types/aiWizard.types';

interface AiWizardResumeBannerProps {
  draft?: WizardDraft | null;
  isGenerating?: boolean;
  overallProgress?: number;
  onResume: () => void;
  onDiscard: () => void;
  isDiscarding?: boolean;
}

export const AiWizardResumeBanner: React.FC<AiWizardResumeBannerProps> = ({
  draft,
  isGenerating = false,
  overallProgress = 0,
  onResume,
  onDiscard,
  isDiscarding = false,
}) => {
  const { t } = useTranslation();
  const lessonCount = draft?.payload?.lessons?.length || 0;
  const draftTitle = draft?.payload?.curriculum_title || t('teacher.aiWizard.resumeBanner.defaultDraftTitle');

  // If in active background generation
  if (isGenerating) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white border border-indigo-700/60 rounded-3xl p-4 sm:p-5 shadow-lg shadow-indigo-950/20">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-indigo-200 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div className="min-w-0 space-y-1.5 flex-1 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-300" />
                  {t('teacher.aiWizard.resumeBanner.generatingTitle', 'Đang sinh câu hỏi & chủ đề bằng AI...')}
                </span>
                <span className="text-xs font-semibold text-indigo-200">
                  {t('teacher.aiWizard.resumeBanner.generatingProgress', { percent: Math.round(overallProgress) })}
                </span>
              </div>
              <p className="text-xs text-indigo-100/80 leading-relaxed line-clamp-1 sm:line-clamp-2">
                {t('teacher.aiWizard.resumeBanner.generatingDesc', 'Tiến trình AI đang chạy ngầm trong nền. Bạn có thể mở lại bất cứ lúc nào để theo dõi chi tiết hoặc lưu lộ trình.')}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden mt-1 max-w-md">
                <div
                  className="bg-gradient-to-r from-indigo-400 to-purple-300 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(5, overallProgress))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={onResume}
              className="bg-white text-indigo-900 hover:bg-indigo-50 border-0 shadow-md font-bold text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              {t('teacher.aiWizard.resumeBanner.viewProgress', 'Xem tiến trình AI')}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Normal incomplete draft state
  if (!draft) return null;

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
          className="shadow-sm shadow-indigo-100 text-xs font-semibold"
        >
          {t('teacher.aiWizard.resumeBanner.resume')}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    </div>
  );
};



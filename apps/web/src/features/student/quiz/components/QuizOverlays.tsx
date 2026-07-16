import React from 'react';
import { useTranslation } from 'react-i18next';

interface QuizOverlaysProps {
  isTimeUp: boolean;
  warnings: number;
  maxWarnings: number;
  warningData: { count: number; max: number } | null;
  onDismissWarning: () => void;
}

export const QuizOverlays: React.FC<QuizOverlaysProps> = ({
  isTimeUp,
  warnings,
  maxWarnings,
  warningData,
  onDismissWarning
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Time Up or Force Submit Popup */}
      {isTimeUp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FDFBF7]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border-4 border-zinc-900 p-8 md:p-12 shadow-[8px_8px_0_0_#dc2626] max-w-lg w-[90%] text-center animate-in zoom-in-95 duration-300">
            <h2 className="text-4xl md:text-5xl font-black text-red-600 uppercase tracking-tighter mb-4">
              {warnings >= maxWarnings ? t('student.quiz.violationExcessive') : t('student.quiz.timeUp')}
            </h2>
            <p className="text-xl font-bold text-zinc-900 uppercase tracking-tight">
              {t('student.quiz.autoSubmitting')}
            </p>
          </div>
        </div>
      )}

      {/* Warning Popup */}
      {warningData && !isTimeUp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FDFBF7]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border-4 border-zinc-900 p-8 md:p-12 shadow-[8px_8px_0_0_#f59e0b] max-w-lg w-[90%] text-center animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl md:text-4xl font-black text-amber-500 uppercase tracking-tighter mb-4">
              {t('student.quiz.cheatWarning')}
            </h2>
            <p className="text-lg font-bold text-zinc-900 mb-6">
              {t('student.quiz.cheatDesc')}
            </p>
            <div className="mb-8 p-4 bg-amber-50 border-2 border-amber-500 font-mono font-bold text-amber-600">
              {t('student.quiz.violationCount', { count: warningData.count, max: warningData.max })}
            </div>
            <button
              onClick={onDismissWarning}
              className="w-full px-8 py-4 font-black text-xl uppercase tracking-tighter text-zinc-900 bg-amber-400 border-2 border-zinc-900 hover:bg-zinc-900 hover:text-amber-400 transition-colors"
            >
              {t('student.quiz.understand')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

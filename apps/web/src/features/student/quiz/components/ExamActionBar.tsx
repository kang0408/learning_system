import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Flag, Grid } from 'lucide-react';

interface ExamActionBarProps {
  currentIndex: number;
  totalQuestions: number;
  isFlagged: boolean;
  onToggleFlag: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onTogglePalette?: () => void;
}

export const ExamActionBar: React.FC<ExamActionBarProps> = ({
  currentIndex,
  totalQuestions,
  isFlagged,
  onToggleFlag,
  onPrev,
  onNext,
  onSubmit,
  onTogglePalette
}) => {
  const { t } = useTranslation();
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div className="w-full bg-white border-t-2 border-zinc-900 px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Previous Button & Palette Button on mobile */}
        <div className="flex items-center gap-2">
          {onTogglePalette && (
            <button
              onClick={onTogglePalette}
              className="lg:hidden flex items-center gap-1.5 border-2 border-zinc-900 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-zinc-100"
              title="Mở danh sách câu hỏi"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>BẢNG CÂU</span>
            </button>
          )}

          <button
            onClick={onPrev}
            disabled={isFirst}
            className="flex items-center gap-1.5 border-2 border-zinc-900 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-900 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('student.quiz.prevQuestion', 'CÂU TRƯỚC')}</span>
          </button>
        </div>

        {/* Center: Flag button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFlag}
            className={`flex items-center gap-1.5 border-2 px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
              isFlagged 
                ? 'border-amber-600 bg-amber-400 text-zinc-900 shadow-[2px_2px_0_0_#d97706]' 
                : 'border-zinc-900 bg-white text-zinc-700 hover:bg-amber-50 hover:border-amber-600 hover:text-amber-900'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
            <span>
              {isFlagged 
                ? t('student.quiz.flaggedBtn', 'ĐÃ ĐÁNH DẤU') 
                : t('student.quiz.flagBtn', 'ĐÁNH DẤU XEM LẠI')}
            </span>
          </button>
        </div>

        {/* Right: Next Button and Submit Button */}
        <div className="flex items-center gap-2">
          {!isLast ? (
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 border-2 border-zinc-900 bg-zinc-900 text-white px-5 py-2 text-xs font-black uppercase tracking-wider hover:bg-indigo-600 hover:border-indigo-600 transition-colors shadow-[2px_2px_0_0_#18181b]"
            >
              <span>{t('student.quiz.nextQuestion', 'CÂU TIẾP THEO')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              className="flex items-center gap-1.5 border-2 border-zinc-900 bg-red-600 text-white px-5 py-2 text-xs font-black uppercase tracking-wider hover:bg-zinc-900 transition-colors shadow-[2px_2px_0_0_#18181b]"
            >
              <span>{t('student.quiz.submitExamBtn', 'NỘP BÀI THI')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

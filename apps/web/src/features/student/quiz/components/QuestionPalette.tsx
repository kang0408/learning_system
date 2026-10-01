import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, CheckCircle, HelpCircle } from 'lucide-react';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  flaggedIndices: Set<number>;
  onSelectQuestion: (index: number) => void;
  onSubmitExam: () => void;
  isSubmitting?: boolean;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  currentIndex,
  answeredIndices,
  flaggedIndices,
  onSelectQuestion,
  onSubmitExam,
  isSubmitting = false
}) => {
  const { t } = useTranslation();

  const answeredCount = answeredIndices.size;
  const flaggedCount = flaggedIndices.size;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  return (
    <div className="w-full lg:w-80 shrink-0 border-2 border-zinc-900 bg-white p-4 flex flex-col justify-between shadow-[4px_4px_0_0_#18181b] space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b-2 border-zinc-900 pb-3 flex items-center justify-between">
          <div>
            <span className="font-bold text-[10px] uppercase tracking-widest text-indigo-600 block">
              {t('student.quiz.paletteSubtitle', 'DANH SÁCH CÂU HỎI')}
            </span>
            <h4 className="text-base font-black tracking-tight uppercase text-zinc-900">
              {t('student.quiz.paletteTitle', 'QUESTION PALETTE')}
            </h4>
          </div>
          <span className="font-mono font-black text-sm bg-indigo-50 border border-indigo-600 text-indigo-700 px-2 py-0.5">
            {answeredCount}/{totalQuestions}
          </span>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 border border-zinc-200 p-2 bg-zinc-50">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-zinc-900 bg-zinc-900 inline-block shrink-0" />
            <span className="truncate">{t('student.quiz.legendAnswered', 'Đã làm')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-amber-600 bg-amber-400 inline-block shrink-0" />
            <span className="truncate">{t('student.quiz.legendFlagged', 'Đánh dấu')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-zinc-900 bg-white inline-block shrink-0" />
            <span className="truncate">{t('student.quiz.legendUnanswered', 'Chưa làm')}</span>
          </div>
        </div>

        {/* Question Grid */}
        <div className="max-h-[320px] overflow-y-auto pr-1">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }, (_, i) => {
              const isCurrent = i === currentIndex;
              const isAnswered = answeredIndices.has(i);
              const isFlagged = flaggedIndices.has(i);

              let btnStyle = 'border-2 border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-100';

              if (isAnswered) {
                btnStyle = 'border-2 border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800';
              }

              if (isFlagged) {
                btnStyle = isAnswered 
                  ? 'border-2 border-amber-600 bg-zinc-900 text-amber-300 ring-2 ring-amber-400'
                  : 'border-2 border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-400';
              }

              if (isCurrent) {
                btnStyle += ' ring-2 ring-indigo-600 ring-offset-2 scale-105 font-black';
              }

              return (
                <button
                  key={`q-palette-${i}`}
                  onClick={() => onSelectQuestion(i)}
                  className={`relative h-10 flex flex-col items-center justify-center font-bold text-xs transition-all ${btnStyle}`}
                  title={`Câu ${i + 1}${isFlagged ? ' (Đã đánh dấu)' : ''}${isAnswered ? ' (Đã trả lời)' : ' (Chưa làm)'}`}
                >
                  <span>{i + 1}</span>
                  {isFlagged && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-500 border border-zinc-900 rounded-full flex items-center justify-center text-[7px] text-white">
                      !
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-200 text-xs font-bold uppercase tracking-wider text-zinc-600">
          <div className="flex justify-between items-center">
            <span>{t('student.quiz.summaryAnswered', 'Số câu đã làm:')}</span>
            <span className="font-mono text-zinc-900">{answeredCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t('student.quiz.summaryUnanswered', 'Số câu chưa làm:')}</span>
            <span className={`font-mono ${unansweredCount > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
              {unansweredCount}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t('student.quiz.summaryFlagged', 'Đang đánh dấu:')}</span>
            <span className="font-mono text-amber-600">{flaggedCount}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2 border-t-2 border-zinc-900">
        <button
          onClick={onSubmitExam}
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-red-600 hover:bg-zinc-900 text-white font-black text-xs md:text-sm uppercase tracking-widest border-2 border-zinc-900 transition-colors shadow-[3px_3px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
        >
          {t('student.quiz.submitExamBtn', 'NỘP BÀI THI')}
        </button>
      </div>
    </div>
  );
};

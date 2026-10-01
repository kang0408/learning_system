import React from 'react';
import { useTranslation } from 'react-i18next';

interface ExamSubmitModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
  timeLeft: number | null;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export const ExamSubmitModal: React.FC<ExamSubmitModalProps> = ({
  isOpen,
  totalQuestions,
  answeredCount,
  unansweredCount,
  flaggedCount,
  timeLeft,
  onCancel,
  onConfirm,
  isSubmitting = false
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const formattedTime = timeLeft !== null 
    ? `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border-4 border-zinc-900 max-w-lg w-full p-6 sm:p-8 shadow-[10px_10px_0_0_#18181b] space-y-6">
        {/* Header */}
        <div className="border-b-2 border-zinc-900 pb-4">
          <span className="font-bold text-xs uppercase tracking-widest text-red-600 block">
            {t('student.quiz.confirmSubmitHeader', 'XÁC NHẬN HOÀN THÀNH')}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900 mt-1">
            {t('student.quiz.confirmSubmitTitle', 'NỘP BÀI THI')}
          </h3>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="border-2 border-zinc-900 p-3 bg-zinc-50 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              {t('student.quiz.answeredStatus', 'ĐÃ TRẢ LỜI')}
            </span>
            <span className="text-2xl font-black text-zinc-900">
              {answeredCount}/{totalQuestions}
            </span>
          </div>

          <div className={`border-2 p-3 text-center ${
            unansweredCount > 0 
              ? 'border-red-600 bg-red-50 text-red-700' 
              : 'border-zinc-900 bg-zinc-50 text-zinc-900'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block">
              {t('student.quiz.unansweredStatus', 'CHƯA TRẢ LỜI')}
            </span>
            <span className="text-2xl font-black">
              {unansweredCount}
            </span>
          </div>

          <div className={`border-2 p-3 text-center col-span-2 sm:col-span-1 ${
            flaggedCount > 0 
              ? 'border-amber-600 bg-amber-50 text-amber-800' 
              : 'border-zinc-900 bg-zinc-50 text-zinc-900'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block">
              {t('student.quiz.flaggedStatus', 'ĐANG ĐÁNH DẤU')}
            </span>
            <span className="text-2xl font-black">
              {flaggedCount}
            </span>
          </div>
        </div>

        {/* Warning messages */}
        {unansweredCount > 0 ? (
          <div className="p-3 border-2 border-red-600 bg-red-50 text-red-900 text-xs font-bold uppercase tracking-wide leading-relaxed">
            [CẢNH BÁO]: Bạn còn {unansweredCount} câu hỏi chưa trả lời. Những câu hỏi chưa trả lời sẽ nhận 0 điểm khi hệ thống chấm bài.
          </div>
        ) : (
          <div className="p-3 border-2 border-zinc-900 bg-emerald-50 text-emerald-900 text-xs font-bold uppercase tracking-wide">
            Bạn đã trả lời đầy đủ {totalQuestions} câu hỏi.
          </div>
        )}

        {flaggedCount > 0 && (
          <div className="p-3 border-2 border-amber-500 bg-amber-50 text-amber-900 text-xs font-bold uppercase tracking-wide">
            Lưu ý: Có {flaggedCount} câu hỏi bạn đang đánh dấu xem lại.
          </div>
        )}

        {formattedTime && (
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-500 border-t border-zinc-200 pt-3">
            <span>{t('student.quiz.timeRemaining', 'Thời gian còn lại:')}</span>
            <span className="font-mono text-zinc-900 text-sm font-black">{formattedTime}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 border-2 border-zinc-900 px-5 py-3.5 font-black uppercase tracking-widest text-xs hover:bg-zinc-100 transition-colors text-zinc-900"
          >
            {t('student.quiz.continueExam', 'QUAY LẠI LÀM TIẾP')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 border-2 border-zinc-900 bg-red-600 text-white px-5 py-3.5 font-black uppercase tracking-widest text-xs hover:bg-zinc-900 transition-colors shadow-[3px_3px_0_0_#18181b] disabled:opacity-50"
          >
            {isSubmitting ? t('student.quiz.grading', 'ĐANG CHẤM ĐIỂM...') : t('student.quiz.confirmSubmitBtn', 'XÁC NHẬN NỘP BÀI')}
          </button>
        </div>
      </div>
    </div>
  );
};

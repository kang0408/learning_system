import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquareQuote, Clock } from 'lucide-react';

interface StudentTeacherFeedbackCardProps {
  teacherName?: string;
  feedback?: string | null;
  updatedAt?: string | null;
}

export const StudentTeacherFeedbackCard: React.FC<StudentTeacherFeedbackCardProps> = ({
  teacherName,
  feedback,
  updatedAt
}) => {
  const { t } = useTranslation();

  if (!feedback || !feedback.trim()) return null;

  const formatDateTime = (isoDate: string | null | undefined) => {
    if (!isoDate) return null;
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 border-2 border-amber-300 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0 shadow-xs border border-amber-200">
          <MessageSquareQuote className="w-6 h-6" />
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
            <h3 className="font-extrabold text-amber-950 text-base md:text-lg tracking-tight">
              {t('student.classDetail.teacherFeedbackTitle', 'Lời dặn & Nhận xét từ Gia sư')}
              {teacherName && (
                <span className="text-amber-800 font-semibold ml-1.5">
                  ({teacherName})
                </span>
              )}
            </h3>
            {updatedAt && (
              <div className="flex items-center gap-1 text-xs text-amber-800/80 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDateTime(updatedAt)}</span>
              </div>
            )}
          </div>
          <p className="text-slate-800 text-sm md:text-base leading-relaxed whitespace-pre-line font-medium">
            {feedback}
          </p>
        </div>
      </div>
    </div>
  );
};

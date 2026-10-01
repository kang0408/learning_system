import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Save, MessageSquareQuote, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/utils/toast';
import { teacherStudentDetailApi } from '../api/teacherStudentDetailApi';

interface TeacherFeedbackCardProps {
  classId: string;
  studentId: string;
  initialFeedback?: string | null;
  feedbackUpdatedAt?: string | null;
}

export const TeacherFeedbackCard: React.FC<TeacherFeedbackCardProps> = ({
  classId,
  studentId,
  initialFeedback = '',
  feedbackUpdatedAt = null
}) => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<string>(initialFeedback || '');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(feedbackUpdatedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  React.useEffect(() => {
    setFeedback(initialFeedback || '');
    setLastSavedAt(feedbackUpdatedAt || null);
    setIsDirty(false);
  }, [studentId, initialFeedback, feedbackUpdatedAt]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
    setIsDirty(true);
  };

  const handleAiSuggest = async () => {
    try {
      setIsGeneratingAi(true);
      toast.info(t('teacher.feedback.generatingAi', 'AI đang tổng hợp dữ liệu học tập để soạn thảo gợi ý nhận xét...'));
      const suggested = await teacherStudentDetailApi.getAiFeedbackDraft(classId, studentId);
      if (suggested) {
        setFeedback(suggested);
        setIsDirty(true);
        toast.success(t('teacher.feedback.aiSuccess', 'Đã tải gợi ý nhận xét từ AI! Thầy/cô có thể chỉnh sửa trước khi lưu.'));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.feedback.aiError', 'Không thể tạo gợi ý nhận xét từ AI.'));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await teacherStudentDetailApi.updateFeedback(classId, studentId, feedback);
      const nowStr = new Date().toISOString();
      setLastSavedAt(nowStr);
      setIsDirty(false);
      toast.success(t('teacher.feedback.saveSuccess', 'Đã lưu nhận xét của gia sư thành công!'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.feedback.saveError', 'Không thể lưu nhận xét. Vui lòng thử lại.'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (isoDate: string | null) => {
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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {t('teacher.feedback.title', 'Nhận xét & Dặn dò của Gia sư')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('teacher.feedback.subtitle', 'Đánh giá năng lực thực tế, gửi phản hồi tới học viên & xuất vào Báo cáo PDF')}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAiSuggest}
          disabled={isGeneratingAi || isSaving}
          className="bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200/80 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          {isGeneratingAi ? (
            <>
              <Spinner className="w-3.5 h-3.5 border-indigo-600" />
              <span>{t('teacher.feedback.aiAnalyzing', 'Đang phân tích...')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('teacher.feedback.aiSuggestBtn', 'AI Gợi ý nhận xét')}</span>
            </>
          )}
        </Button>
      </div>

      <div className="relative">
        <textarea
          value={feedback}
          onChange={handleTextChange}
          rows={5}
          placeholder={t(
            'teacher.feedback.placeholder',
            'Nhập lời nhận xét sư phạm, đánh giá thái độ học tập và dặn dò bài học dành riêng cho học viên này... (Hoặc bấm "AI Gợi ý nhận xét" để tạo nhanh)'
          )}
          className="w-full p-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y leading-relaxed"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {lastSavedAt ? (
            <>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {t('teacher.feedback.lastUpdated', 'Cập nhật lần cuối:')}{' '}
                <span className="font-medium text-slate-700">{formatDateTime(lastSavedAt)}</span>
              </span>
              {!isDirty && (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium ml-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('teacher.feedback.saved', 'Đã lưu')}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 italic">
              {t('teacher.feedback.noFeedbackYet', 'Chưa có nhận xét nào được lưu.')}
            </span>
          )}
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isGeneratingAi || (!isDirty && !!lastSavedAt)}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 self-end sm:self-auto shadow-xs"
        >
          {isSaving ? (
            <>
              <Spinner className="w-3.5 h-3.5 border-white" />
              <span>{t('teacher.feedback.saving', 'Đang lưu...')}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{t('teacher.feedback.saveBtn', 'Lưu nhận xét')}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

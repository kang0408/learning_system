import React, { Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, XCircle, Clock, Calendar, Target, Brain, ArrowRight } from 'lucide-react';
import { useSessionResultData } from '../../../student/session-result/hooks/useSessionResultData';
import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

interface SessionResultModalProps {
  sessionId: string;
  onClose: () => void;
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
};

const SessionResultContent: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const { t } = useTranslation();
  const { data: result } = useSessionResultData(sessionId, null);

  const answers = result.session_answers || [];

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title={t('teacher.studentDetail.sessionResult.score')}
          value={`${Number(result.score || 0).toFixed(0)}%`}
        />
        <StatCard
          title={t('teacher.studentDetail.sessionResult.correctQuestions')}
          value={`${result.correct_questions}/${result.total_questions}`}
          icon={<Target className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title={t('teacher.studentDetail.sessionResult.duration')}
          value={formatDuration(result.duration_seconds || 0)}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title={t('teacher.studentDetail.sessionResult.submittedDate')}
          value={result.finished_at ? new Date(result.finished_at).toLocaleDateString() : '--'}
          icon={<Calendar className="w-5 h-5 text-blue-500" />}
        />
      </div>

      {/* Answers Review */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          {t('teacher.studentDetail.sessionResult.questionDetails')}
        </h3>
        <div className="space-y-4">
          {answers.map((answer: any, index: number) => {
            const isCorrect = answer.is_correct;
            const qType = answer.question.question_type;
            const options = answer.question.answer_options || [];

            return (
              <div 
                key={answer.id} 
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${
                  isCorrect ? 'border-emerald-200' : 'border-red-200'
                }`}
              >
                <div className={`px-5 py-3 border-b flex justify-between items-center ${
                  isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'
                }`}>
                  <span className="font-bold text-slate-800 text-sm">{t('teacher.studentDetail.sessionResult.questionNumber', { num: index + 1 })}</span>
                  <Badge variant={isCorrect ? 'success' : 'danger'}>
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                    {isCorrect ? t('teacher.studentDetail.sessionResult.correct') : t('teacher.studentDetail.sessionResult.incorrect')}
                  </Badge>
                </div>

                <div className="p-5">
                  <p className="text-slate-900 font-bold mb-5 text-base">{answer.question.content}</p>

                  {/* Choice Types */}
                  {['multiple_choice', 'true_false', 'multi_select'].includes(qType) && (
                    <div className="space-y-2.5">
                      {options.map((opt: any) => {
                        let isSelected = false;
                        if (qType === 'multi_select' || (answer.text_answer && answer.text_answer.startsWith('['))) {
                          try {
                            const ids = JSON.parse(answer.text_answer || '[]');
                            isSelected = ids.includes(opt.id);
                          } catch(e) {}
                        } else {
                          isSelected = answer.selected_option === opt.id;
                        }
                        
                        const isOptCorrect = opt.is_correct;
                        
                        let optClass = "flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold transition-colors ";
                        let icon = null;

                        if (isOptCorrect && isSelected) {
                          optClass += "border-emerald-500 bg-emerald-50 text-emerald-900";
                          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
                        } else if (isOptCorrect && !isSelected) {
                          optClass += "border-emerald-300 bg-white text-emerald-700 border-dashed";
                          icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
                        } else if (!isOptCorrect && isSelected) {
                          optClass += "border-red-300 bg-red-50 text-red-900";
                          icon = <XCircle className="w-5 h-5 text-red-600 shrink-0" />;
                        } else {
                          optClass += "border-slate-100 bg-slate-50/50 text-slate-600";
                          icon = <div className="w-5 h-5 shrink-0 rounded-full border-2 border-slate-200" />;
                        }

                        return (
                          <div key={opt.id} className={optClass}>
                            {icon}
                            <span>{opt.content}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill in the blank */}
                  {qType === 'fill_blank' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-500 uppercase">{t('teacher.studentDetail.sessionResult.studentAnswer')}</span>
                        <div className={`p-3 rounded-xl border font-bold text-sm ${
                          isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                        }`}>
                          {answer.text_answer || <span className="italic opacity-50">{t('teacher.studentDetail.sessionResult.noAnswer')}</span>}
                        </div>
                      </div>
                      {!isCorrect && options && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-emerald-600 uppercase">{t('teacher.studentDetail.sessionResult.correctAnswer')}</span>
                          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 font-bold text-sm">
                            {options.filter((o: any) => o.is_correct).map((o: any) => o.content).join(t('teacher.studentDetail.sessionResult.or'))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Matching */}
                  {qType === 'matching' && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">{t('teacher.studentDetail.sessionResult.studentMatch')}</span>
                        <div className="space-y-2">
                          {(() => {
                            try {
                              const pairs = JSON.parse(answer.text_answer || '[]');
                              if (pairs.length === 0) return <div className="text-slate-400 italic text-sm font-medium">{t('teacher.studentDetail.sessionResult.noAnswer')}</div>;
                              const originalPairs = (answer.question.metadata as any)?.pairs || [];
                              
                              return pairs.map((p: any, i: number) => {
                                const originalLeft = originalPairs.find((op: any) => op.leftId === p.leftId);
                                const originalRight = originalPairs.find((op: any) => op.rightId === p.rightId);
                                const leftText = originalLeft ? originalLeft.leftText : (p.leftText || p.leftId);
                                const rightText = originalRight ? originalRight.rightText : (p.rightText || p.rightId);
                                
                                const isPairCorrect = isCorrect || (originalLeft && originalLeft.rightId === p.rightId);

                                return (
                                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-bold ${
                                    isPairCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                                  }`}>
                                    <div className="flex-1 text-right">{leftText}</div>
                                    <ArrowRight className={`w-4 h-4 shrink-0 ${isPairCorrect ? 'text-emerald-600' : 'text-red-500'}`} />
                                    <div className="flex-1">{rightText}</div>
                                  </div>
                                );
                              });
                            } catch(e) {
                              return <div className="text-red-500 text-sm font-medium">{t('teacher.studentDetail.sessionResult.displayError')}</div>;
                            }
                          })()}
                        </div>
                      </div>

                      {!isCorrect && answer.question.metadata && (answer.question.metadata as any).pairs && (
                        <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                          <span className="text-xs font-bold text-emerald-600 uppercase">{t('teacher.studentDetail.sessionResult.correctAnswer')}</span>
                          <div className="space-y-2">
                            {(answer.question.metadata as any).pairs.map((p: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm font-bold border-dashed">
                                <div className="flex-1 text-right">{p.leftText}</div>
                                <ArrowRight className="w-4 h-4 shrink-0 text-emerald-600" />
                                <div className="flex-1">{p.rightText}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const SessionResultModal: React.FC<SessionResultModalProps> = ({ sessionId, onClose }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-slate-50 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
      >
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 bg-white z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 border border-indigo-100">
              <Brain className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t('teacher.studentDetail.sessionResult.sessionDetails')}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-8 overflow-y-auto">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Spinner size="lg" />
              <p className="text-sm font-medium text-slate-500">{t('teacher.studentDetail.sessionResult.loadingData')}</p>
            </div>
          }>
            <SessionResultContent sessionId={sessionId} />
          </Suspense>
        </div>
      </div>
    </div>,
    document.body
  );
};


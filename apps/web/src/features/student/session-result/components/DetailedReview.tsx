import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SessionAnswer } from '../types';

interface DetailedReviewProps {
  answers: SessionAnswer[];
}

export const DetailedReview: React.FC<DetailedReviewProps> = ({ answers }) => {
  const { t } = useTranslation();

  if (!answers || answers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-6 sm:mb-8">
        {t('student.result.detailedReview')}
      </h3>
      <div className="space-y-4">
        {answers.map((answer, index) => {
          const isCorrect = answer.is_correct;
          return (
            <div key={answer.id} className={`border-4 p-6 md:p-8 ${isCorrect ? 'border-zinc-900 bg-white' : 'border-red-600 bg-red-50'}`}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <p className="font-black text-xl sm:text-2xl md:text-3xl tracking-tight leading-snug">
                    <span className="text-indigo-600 mr-2 sm:mr-4 font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                    {answer.question.content}
                  </p>
                  <div className={`shrink-0 text-sm sm:text-base font-black uppercase tracking-widest px-3 py-1 border-2 ${isCorrect ? 'border-zinc-900 text-zinc-900' : 'border-red-600 text-red-600'}`}>
                    {isCorrect ? t('student.result.correct') : t('student.result.incorrect')}
                  </div>
                </div>
                
                {/* Options */}
                {['multiple_choice', 'true_false'].includes(answer.question.question_type) && answer.question.answer_options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {answer.question.answer_options.map((opt) => {
                      const isSelected = answer.selected_option === opt.id;
                      const isOptCorrect = opt.is_correct;
                      
                      let boxClass = "p-4 border-2 font-bold text-lg ";
                      if (isOptCorrect) {
                        boxClass += "border-green-600 bg-green-100 text-green-900";
                      } else if (isSelected && !isOptCorrect) {
                        boxClass += "border-red-600 bg-red-600 text-white";
                      } else {
                        boxClass += "border-zinc-200 text-zinc-400";
                      }

                      return (
                        <div key={opt.id} className={boxClass}>
                          {opt.content}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!['multiple_choice', 'true_false'].includes(answer.question.question_type) && (
                  <div className="mt-4 p-4 border-2 border-indigo-600 font-mono text-lg font-bold bg-indigo-50">
                     <span className="text-indigo-600 uppercase tracking-widest text-sm block mb-2">{t('student.result.yourAnswer')}</span> 
                     <span className={isCorrect ? 'text-zinc-900' : 'text-red-600'}>
                       {answer.text_answer || t('student.result.noAnswer')}
                     </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

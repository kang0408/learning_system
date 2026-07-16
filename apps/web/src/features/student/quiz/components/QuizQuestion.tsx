import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Question } from '../types';

interface QuizQuestionProps {
  question: Question;
  selectedOptionId: string | null;
  correctAnswerId: string | null;
  feedback: 'correct' | 'incorrect' | null;
  submitting: boolean;
  onSelect: (optId: string) => void;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  selectedOptionId,
  correctAnswerId,
  feedback,
  submitting,
  onSelect
}) => {
  const { t } = useTranslation();

  const shuffledOptions = useMemo(() => {
    if (!question?.answer_options) return [];
    if (question.question_type === 'multiple_choice') {
      return [...question.answer_options].sort(() => Math.random() - 0.5);
    }
    return question.answer_options;
  }, [question?.id, question?.answer_options, question?.question_type]);

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-8 md:px-16 flex flex-col justify-center animate-in slide-in-from-right-8 fade-in duration-500 pb-16 pt-8 overflow-y-auto">
      {question?.topic && (
        <div className="mb-6">
          <span className="font-bold uppercase tracking-[0.2em] text-indigo-600 text-xs bg-indigo-50 px-3 py-1.5 border-2 border-indigo-600">
            {t('student.quiz.topic')} {question.topic}
          </span>
        </div>
      )}

      <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-zinc-900 mb-8 leading-[1.2] tracking-tight w-full max-w-4xl border-l-6 border-indigo-600 pl-6 shrink-0">
        {question?.content}
      </h2>

      <div className="grid grid-cols-1 gap-4 w-full max-w-4xl ml-auto pb-4">
        {shuffledOptions.map((opt) => {
          const isSelected = opt.id === selectedOptionId;
          const isCorrect = opt.id === correctAnswerId;

          let btnClass = 'border-4 border-zinc-900 bg-white text-zinc-900 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white';

          if (submitting && !feedback && isSelected) {
            btnClass = 'border-4 border-indigo-600 bg-indigo-600 text-white';
          }

          if (feedback) {
            if (isCorrect) {
              btnClass = 'border-4 border-green-600 bg-green-600 text-white';
            } else if (isSelected) {
              btnClass = 'border-4 border-red-600 bg-red-600 text-white line-through decoration-4';
            } else {
              btnClass = 'border-4 border-zinc-200 bg-white text-zinc-300 opacity-50';
            }
          }

          return (
            <button
              key={opt.id}
              disabled={!!feedback || submitting}
              onClick={() => onSelect(opt.id)}
              className={`p-4 md:p-5 text-left font-black text-xl md:text-2xl uppercase tracking-tight transition-colors ${btnClass}`}
            >
              {opt.content}
            </button>
          );
        })}
      </div>
    </div>
  );
};

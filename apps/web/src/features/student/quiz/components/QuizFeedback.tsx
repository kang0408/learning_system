import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Question } from '../types';

interface QuizFeedbackProps {
  feedback: 'correct' | 'incorrect' | null;
  question: Question;
  onNext: () => void;
}

export const QuizFeedback: React.FC<QuizFeedbackProps> = ({
  feedback,
  question,
  onNext
}) => {
  const { t } = useTranslation();

  return (
    <div className={`absolute bottom-0 left-0 w-full border-t-4 bg-[#FDFBF7] transition-transform duration-500 ease-out z-20 ${
      feedback ? 'translate-y-0' : 'translate-y-full'
    } ${feedback === 'correct' ? 'border-green-600' : 'border-red-600'}`}>
      <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex-1 max-h-[35vh] overflow-y-auto pr-4">
          <h3 className={`text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2 ${
            feedback === 'correct' ? 'text-green-600' : 'text-red-600'
          }`}>
            {feedback === 'correct' ? t('student.quiz.correct') : t('student.quiz.incorrect')}
          </h3>

          {question?.explanation && (
            <div className="mt-4 border-l-4 border-indigo-600 px-5 py-3 bg-indigo-50">
              <span className="font-bold uppercase tracking-widest text-indigo-600 text-xs block mb-1">
                {t('student.quiz.explanation')}
              </span>
              <p className="text-base md:text-lg font-medium leading-relaxed max-w-3xl text-zinc-900">
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          className="w-full md:w-auto px-10 py-5 font-black text-xl md:text-2xl uppercase tracking-tighter text-white bg-indigo-600 hover:bg-zinc-900 transition-colors whitespace-nowrap shrink-0 border-2 border-indigo-600 hover:border-zinc-900"
        >
          {t('student.quiz.next')} <span className="font-mono">→</span>
        </button>
      </div>
    </div>
  );
};

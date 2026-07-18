import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Question } from '../types';

interface QuizFeedbackProps {
  feedback: 'correct' | 'incorrect' | null;
  question: Question;
  explanation?: string | null;
  fillBlankAnswer?: string | null;
  matchingPairs?: string[] | null;
  choiceTexts?: string[] | null;
  onNext: () => void;
  isLastQuestion?: boolean;
}

export const QuizFeedback: React.FC<QuizFeedbackProps> = ({
  feedback,
  question,
  explanation,
  fillBlankAnswer,
  matchingPairs,
  choiceTexts,
  onNext,
  isLastQuestion
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-expand when new feedback arrives
  useEffect(() => {
    if (feedback) setIsCollapsed(false);
  }, [feedback]);

  return (
    <div className={`absolute bottom-0 left-0 w-full border-t-4 bg-[#FDFBF7] transition-all duration-500 ease-out z-20 ${
      feedback ? (isCollapsed ? 'translate-y-[calc(100%-60px)]' : 'translate-y-0') : 'translate-y-full'
    } ${feedback === 'correct' ? 'border-green-600' : 'border-red-600'}`}>
      
      {/* Collapse Toggle Bar */}
      <div 
        className={`w-full flex justify-center py-2 cursor-pointer hover:bg-black/5 transition-colors ${!feedback ? 'hidden' : ''}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
          {isCollapsed ? (
            <><ChevronUp className="w-4 h-4" /> Mở rộng giải thích <ChevronUp className="w-4 h-4" /></>
          ) : (
            <><ChevronDown className="w-4 h-4" /> Thu gọn giải thích <ChevronDown className="w-4 h-4" /></>
          )}
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-8 pb-8 pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex-1 pr-4 max-h-[40vh] overflow-y-auto">
          <h3 className={`text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 ${
            feedback === 'correct' ? 'text-green-600' : 'text-red-600'
          }`}>
            {feedback === 'correct' ? t('student.quiz.correct') : t('student.quiz.incorrect')}
          </h3>

          {/* Correct Answers for all types when Incorrect */}
          {feedback === 'incorrect' && (fillBlankAnswer || matchingPairs || choiceTexts) && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-600">
              <span className="font-bold uppercase tracking-widest text-green-700 text-sm block mb-2">
                {t('student.quiz.correctAnswer')}
              </span>
              
              {fillBlankAnswer && (
                <div className="text-xl font-black text-green-800 uppercase">
                  {fillBlankAnswer}
                </div>
              )}

              {matchingPairs && (
                <ul className="flex flex-col gap-2">
                  {matchingPairs.map((pair, idx) => (
                    <li key={idx} className="text-base font-bold text-green-800 bg-green-200/50 p-2 border border-green-300">
                      {pair}
                    </li>
                  ))}
                </ul>
              )}

              {choiceTexts && (
                <ul className="flex flex-col gap-2">
                  {choiceTexts.map((text, idx) => (
                    <li key={idx} className="text-lg font-black text-green-800 uppercase">
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(explanation || question?.explanation) && (
            <div className="mt-4 border-l-4 border-indigo-600 px-5 py-3 bg-indigo-50">
              <span className="font-bold uppercase tracking-widest text-indigo-600 text-xs block mb-1">
                {t('student.quiz.explanation')}
              </span>
              <div className="text-base md:text-lg font-medium leading-relaxed max-w-3xl text-zinc-900 markdown-content">
                <ReactMarkdown>{explanation || question.explanation || ''}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          className="w-full md:w-auto px-10 py-5 font-black text-xl md:text-2xl uppercase tracking-tighter text-white bg-indigo-600 hover:bg-zinc-900 transition-colors whitespace-nowrap shrink-0 border-2 border-indigo-600 hover:border-zinc-900 shadow-[6px_6px_0_0_#18181b] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
        >
          {isLastQuestion ? 'HOÀN THÀNH' : t('student.quiz.next')} <span className="font-mono">→</span>
        </button>
      </div>
    </div>
  );
};

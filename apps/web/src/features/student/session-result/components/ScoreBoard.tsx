import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ResultData } from '../types';

interface ScoreBoardProps {
  result: ResultData;
  sessionId: string | null;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ result, sessionId }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      {/* Massive Score Typography */}
      <div className="text-center border-b-8 border-indigo-600 pb-8 sm:pb-16 mb-8 sm:mb-16 relative w-full overflow-hidden sm:overflow-visible">
        <p className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.3em] text-indigo-600 mb-4 sm:mb-8">
          {t('student.result.completed')}
        </p>
        <div className="text-[4rem] sm:text-[8rem] md:text-[12rem] lg:text-[16rem] leading-none font-black tracking-tighter relative inline-block text-zinc-900 pr-10 sm:pr-16 md:pr-24 lg:pr-32">
          {Number(result.score || 0).toFixed(2)}
          <span className="text-[2rem] sm:text-[3rem] md:text-[5rem] lg:text-[6rem] absolute top-2 sm:top-4 md:top-6 lg:top-8 right-0 text-indigo-600">%</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 sm:gap-8 mb-8 sm:mb-16">
        <div className="text-center md:text-left">
          <p className="text-sm sm:text-base font-bold uppercase tracking-widest text-zinc-500 mb-2">
            {t('student.result.nextReview')}
          </p>
          <p className="text-xl sm:text-3xl font-black uppercase tracking-tighter">
            {result.next_review_date 
              ? new Date(result.next_review_date).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }) 
              : t('student.result.tomorrow')}
          </p>
        </div>
        <button
          onClick={() => {
            if (sessionId) {
              navigate(-1);
            } else {
              navigate('/student');
            }
          }}
          className="font-bold bg-indigo-600 text-white border-2 border-indigo-600 px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl hover:bg-zinc-900 hover:border-zinc-900 transition-colors uppercase tracking-widest w-full md:w-auto text-center"
        >
          {t('student.result.continue')}
        </button>
      </div>
    </>
  );
};

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
      <div className="text-center border-b-8 border-indigo-600 pb-16 mb-16 relative">
        <p className="text-xl md:text-2xl font-bold uppercase tracking-[0.3em] text-indigo-600 mb-8">
          {t('student.result.completed')}
        </p>
        <div className="text-[12rem] md:text-[18rem] leading-none font-black tracking-tighter relative inline-block text-zinc-900">
          {result.score || 0}
          <span className="text-[4rem] md:text-[6rem] absolute top-8 -right-16 md:-right-24 text-indigo-600">%</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
        <div>
          <p className="font-bold uppercase tracking-widest text-zinc-500 mb-2">
            {t('student.result.nextReview')}
          </p>
          <p className="text-3xl font-black uppercase tracking-tighter">
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
          className="font-bold bg-indigo-600 text-white border-2 border-indigo-600 px-12 py-6 text-xl hover:bg-zinc-900 hover:border-zinc-900 transition-colors uppercase tracking-widest w-full md:w-auto text-center"
        >
          {t('student.result.continue')}
        </button>
      </div>
    </>
  );
};

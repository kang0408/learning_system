import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useJoinClass } from '../hooks/useClassesData';
import { AxiosError } from 'axios';

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { t } = useTranslation();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const { mutateAsync: joinClass, isPending: joining } = useJoinClass();

  const handleJoinClass = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setError('');

    try {
      await joinClass({ join_code: joinCode });
      onSuccess(t('student.classes.successJoin'));
      setJoinCode('');
      onClose();
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || t('student.classes.errorJoin'));
      } else {
        setError(t('student.classes.errorJoin'));
      }
    }
  }, [joinCode, joinClass, onClose, onSuccess, t]);

  const handleClose = useCallback(() => {
    setError('');
    setJoinCode('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="border-4 border-indigo-600 bg-[#FDFBF7] shadow-[16px_16px_0_0_#4f46e5] max-w-xl w-full p-8 md:p-12 animate-in zoom-in-95 duration-200">
        <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-indigo-600">
          {t('student.classes.modalTitle1')}<br/>{t('student.classes.modalTitle2')}
        </h3>
        <p className="text-lg font-medium text-zinc-600 mb-8">{t('student.classes.modalDesc')}</p>

        <form onSubmit={handleJoinClass} className="space-y-8">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder={t('student.classes.codePlaceholder')}
            maxLength={6}
            className="w-full bg-transparent border-b-4 border-zinc-900 focus:border-indigo-600 py-4 text-center tracking-[0.5em] font-black text-5xl md:text-6xl outline-none uppercase placeholder:text-zinc-300 transition-colors"
            autoFocus
          />

          {error && (
            <p className="text-lg font-bold text-red-600 uppercase tracking-widest text-center">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse md:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-4 text-zinc-900 font-bold uppercase tracking-widest border-2 border-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              {t('student.classes.cancel')}
            </button>
            <button
              type="submit"
              disabled={joining || joinCode.trim().length === 0}
              className="flex-1 py-4 text-white bg-indigo-600 font-bold uppercase tracking-widest border-2 border-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {joining ? t('student.classes.connecting') : t('student.classes.joinNow')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useClassesData } from './hooks/useClassesData';
import { ClassList } from './components/ClassList';
import { JoinClassModal } from './components/JoinClassModal';

export const StudentClassesFeature: React.FC = () => {
  const { t } = useTranslation();
  const { data: classes } = useClassesData();
  
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleOpenModal = useCallback(() => {
    setShowJoinModal(true);
    setSuccessMsg(''); // Clear previous messages
  }, []);

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-zinc-900 pb-8">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9]">
          {t('student.classes.title1')}<br/>
          <span className="text-indigo-600">{t('student.classes.title2')}</span>
        </h1>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 text-white font-bold uppercase tracking-widest px-8 py-4 hover:bg-indigo-700 transition-colors border-2 border-indigo-600 whitespace-nowrap shadow-[4px_4px_0_0_rgba(24,24,27,1)] hover:translate-y-1 hover:shadow-none"
        >
          {t('student.classes.joinBtn')}
        </button>
      </div>

      {successMsg && (
        <div className="bg-indigo-50 border-2 border-indigo-600 text-indigo-900 p-6 font-bold uppercase tracking-widest text-sm">
          {successMsg}
        </div>
      )}

      <ClassList classes={classes} />

      <JoinClassModal 
        isOpen={showJoinModal} 
        onClose={() => setShowJoinModal(false)} 
        onSuccess={setSuccessMsg} 
      />
    </div>
  );
};

export default StudentClassesFeature;

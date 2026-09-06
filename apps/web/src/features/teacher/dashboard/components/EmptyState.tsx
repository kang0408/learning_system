import React from 'react';
import { Plus, LayoutTemplate } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateClick }) => {
  const { t } = useTranslation();
  return (
    <div className="col-span-full text-center py-16 px-4 bg-slate-50/50 border-2 border-dashed border-slate-200/80 rounded-3xl flex flex-col items-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl border border-indigo-100/80 flex items-center justify-center mb-4">
        <LayoutTemplate className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-1.5">{t('teacher.dashboard.emptyTitle')}</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-sm font-medium">{t('teacher.dashboard.emptyDesc')}</p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-xs active:scale-[0.98]"
      >
        <Plus className="w-4 h-4 mr-2" /> {t('teacher.dashboard.createBtnEmpty')}
      </button>
    </div>
  );
};

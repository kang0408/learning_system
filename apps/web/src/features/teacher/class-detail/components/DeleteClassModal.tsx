import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeleteClassModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  className: string;
}

export const DeleteClassModal: React.FC<DeleteClassModalProps> = ({ onClose, onConfirm, isDeleting, className }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 text-red-600">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('teacher.classDetail.deleteClassModalTitle')}</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-8 leading-relaxed">
          {t('teacher.classDetail.deleteClassModalDesc', { name: className })}
        </p>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm"
          >
            {t('teacher.classDetail.cancelBtn')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm text-sm"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {t('teacher.classDetail.confirmDeleteBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EditClassModalProps {
  onClose: () => void;
  onSubmit: (payload: { name: string; subject?: string; description?: string }) => Promise<void>;
  isUpdating: boolean;
  initialData: {
    name: string;
    subject: string;
    description: string;
  };
}

export const EditClassModal: React.FC<EditClassModalProps> = ({ onClose, onSubmit, isUpdating, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: initialData.name,
    subject: initialData.subject || '',
    description: initialData.description || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await onSubmit({
      name: formData.name,
      subject: formData.subject,
      description: formData.description
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full relative animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('teacher.classDetail.editClassTitle')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('teacher.classDetail.editClassDesc')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-1.5">
                {t('teacher.classDetail.classNameLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm font-medium"
                placeholder={t('teacher.classDetail.classNamePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-1.5">
                {t('teacher.classDetail.subjectLabel')}
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm font-medium"
                placeholder={t('teacher.classDetail.subjectPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-1.5">
                {t('teacher.classDetail.descriptionLabel')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm font-medium resize-none"
                placeholder={t('teacher.classDetail.descriptionPlaceholder')}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('teacher.classDetail.cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={isUpdating || !formData.name.trim()}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('teacher.classDetail.loading')}
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  {t('teacher.classDetail.saveChangesBtn')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

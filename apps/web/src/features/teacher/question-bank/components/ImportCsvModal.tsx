import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Upload, Download, X } from 'lucide-react';
import { useImportCsv } from '../hooks/useTeacherQuestionBank';
import type { ImportCsvResult } from '../types';
import { toast } from '@/utils/toast';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { mutateAsync: importCsv, isPending } = useImportCsv();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportCsvResult | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      const res = await importCsv(file);
      setResult(res);
      toast.success(t('teacher.questionBank.importCsv.success'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.questionBank.importCsv.error'));
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('teacher.questionBank.importCsv.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('teacher.questionBank.importCsv.description')}</p>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {result ? (
            <div className="space-y-6">
              <div className="p-5 bg-green-50 text-green-800 rounded-xl border border-green-200 flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-xl font-bold">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('teacher.questionBank.importCsv.successTitle')}</h3>
                  <p className="text-green-700 mt-0.5">{t('teacher.questionBank.importCsv.successDesc', { count: result.importedCount })}</p>
                </div>
              </div>
              
              {result.errors && result.errors.length > 0 && (
                <div className="p-5 bg-red-50 text-red-800 rounded-xl border border-red-200">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs mr-2">!</span>
                    {t('teacher.questionBank.importCsv.errorTitle', { count: result.errors.length })}
                  </h3>
                  <ul className="list-disc list-inside text-sm space-y-1.5 ml-7 max-h-40 overflow-y-auto text-red-700">
                    {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-end pt-5 mt-5 border-t border-gray-100">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-sm"
                >
                  {t('teacher.questionBank.importCsv.close')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-end mb-2">
                <a 
                  href="/questions_import_template.csv"
                  download="questions_import_template.csv"
                  className="flex items-center px-4 py-2 bg-amber-50 text-amber-700 text-sm font-semibold rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" /> {t('teacher.questionBank.importCsv.downloadTemplate')}
                </a>
              </div>

              <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 text-indigo-900">
                <p className="font-semibold mb-3">{t('teacher.questionBank.importCsv.noteTitle')}</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-indigo-800">
                  <li><b>{t('teacher.questionBank.importCsv.noteType')}</b> <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-xs">multiple_choice</code> {t('teacher.questionBank.importCsv.noteTypeOr')} <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-xs">true_false</code></li>
                  <li><b>{t('teacher.questionBank.importCsv.noteDifficulty')}</b> {t('teacher.questionBank.importCsv.noteDifficultyDesc')}</li>
                  <li><b>{t('teacher.questionBank.importCsv.noteAnswer')}</b> {t('teacher.questionBank.importCsv.noteAnswerDesc')}</li>
                  <li>{t('teacher.questionBank.importCsv.noteCode')} <b>{t('teacher.questionBank.importCsv.noteCodeBold')}</b> {t('teacher.questionBank.importCsv.noteCodeDesc')}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">{t('teacher.questionBank.importCsv.fileLabel')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 border border-gray-200 rounded-xl cursor-pointer bg-gray-50"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  {t('teacher.questionBank.importCsv.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPending || !file}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center transition-colors text-sm shadow-sm"
                >
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {t('teacher.questionBank.importCsv.submit')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

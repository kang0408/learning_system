import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { useImportCsv } from '../hooks/useTeacherQuestionBank';
import type { ImportCsvResult } from '../types';
import { toast } from '@/utils/toast';
import { Dialog } from '@/components/ui/Dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { FileUploadDropzone } from '@/components/ui/FileUploadDropzone';
import { Button } from '@/components/ui/Button';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { mutateAsync: importCsv, isPending } = useImportCsv();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportCsvResult | null>(null);

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
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={t('teacher.questionBank.importCsv.title')}
      description={t('teacher.questionBank.importCsv.description')}
      maxWidth="2xl"
    >
      {result ? (
        <div className="space-y-6">
          <Alert variant="success">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <AlertTitle className="text-emerald-950 font-bold">{t('teacher.questionBank.importCsv.successTitle')}</AlertTitle>
              <AlertDescription className="text-emerald-800">
                {t('teacher.questionBank.importCsv.successDesc', { count: result.importedCount })}
              </AlertDescription>
            </div>
          </Alert>
          
          {result.errors && result.errors.length > 0 && (
            <Alert variant="danger">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="w-full">
                <AlertTitle className="text-red-950 font-bold">
                  {t('teacher.questionBank.importCsv.errorTitle', { count: result.errors.length })}
                </AlertTitle>
                <AlertDescription className="text-red-800 mt-2">
                  <ul className="list-disc list-inside text-sm space-y-1.5 max-h-40 overflow-y-auto">
                    {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          <div className="flex justify-end pt-5 mt-5 border-t border-gray-100">
            <Button
              variant="primary"
              onClick={handleClose}
            >
              {t('teacher.questionBank.importCsv.close')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-end">
            <a 
              href="/questions_import_template.csv"
              download="questions_import_template.csv"
              className="inline-flex items-center px-3.5 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> {t('teacher.questionBank.importCsv.downloadTemplate')}
            </a>
          </div>

          <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 text-indigo-900">
            <p className="font-semibold mb-3 text-sm">{t('teacher.questionBank.importCsv.noteTitle')}</p>
            <ul className="list-disc list-inside space-y-2 text-xs text-indigo-800 font-medium">
              <li><b>{t('teacher.questionBank.importCsv.noteType')}</b> <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-xs">multiple_choice</code> {t('teacher.questionBank.importCsv.noteTypeOr')} <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-xs">true_false</code></li>
              <li><b>{t('teacher.questionBank.importCsv.noteDifficulty')}</b> {t('teacher.questionBank.importCsv.noteDifficultyDesc')}</li>
              <li><b>{t('teacher.questionBank.importCsv.noteAnswer')}</b> {t('teacher.questionBank.importCsv.noteAnswerDesc')}</li>
              <li>{t('teacher.questionBank.importCsv.noteCode')} <b>{t('teacher.questionBank.importCsv.noteCodeBold')}</b> {t('teacher.questionBank.importCsv.noteCodeDesc')}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <FileUploadDropzone
              accept=".csv"
              selectedFile={file}
              onFileSelect={setFile}
              title={t('teacher.questionBank.importCsv.fileLabel')}
              subtitle="Hỗ trợ file định dạng CSV"
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              {t('teacher.questionBank.importCsv.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!file}
              isLoading={isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              {t('teacher.questionBank.importCsv.submit')}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
};

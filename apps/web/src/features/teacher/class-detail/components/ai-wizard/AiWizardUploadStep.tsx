import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  X,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AiWizardUploadStepProps {
  onExtract: (payload: { file?: File; documentText?: string }) => Promise<void>;
  isLoading: boolean;
}

export const AiWizardUploadStep: React.FC<AiWizardUploadStepProps> = ({
  onExtract,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setErrorMsg(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      setErrorMsg(t('teacher.aiWizard.uploadStep.fileTypeError'));
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg(t('teacher.aiWizard.uploadStep.fileSizeError'));
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (activeTab === 'upload') {
      if (!selectedFile) {
        setErrorMsg(t('teacher.aiWizard.uploadStep.noFileError'));
        return;
      }
      await onExtract({ file: selectedFile });
    } else {
      if (!manualText.trim()) {
        setErrorMsg(t('teacher.aiWizard.uploadStep.noTextError'));
        return;
      }
      await onExtract({ documentText: manualText });
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-1 border border-indigo-100/80 shadow-sm">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          {t('teacher.aiWizard.uploadStep.title')}
        </h3>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          {t('teacher.aiWizard.uploadStep.desc')}
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            {t('teacher.aiWizard.uploadStep.tabUpload')}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('text');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'text'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            {t('teacher.aiWizard.uploadStep.tabText')}
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: File Upload Drag & Drop */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          {!selectedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.005]'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                {t('teacher.aiWizard.uploadStep.dragDropLabel')}{' '}
                <span className="text-indigo-600 underline">
                  {t('teacher.aiWizard.uploadStep.chooseFile')}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                {t('teacher.aiWizard.uploadStep.supportedFormats')}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!isLoading && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manual Textarea */}
      {activeTab === 'text' && (
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('teacher.aiWizard.uploadStep.manualTextLabel')}
          </label>
          <textarea
            rows={8}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            disabled={isLoading}
            placeholder={t('teacher.aiWizard.uploadStep.manualTextPlaceholder')}
            className="w-full text-xs sm:text-sm font-mono border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-slate-50"
          />
        </div>
      )}

      {/* Loading Overlay / Progress Indicator */}
      {isLoading && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-2.5 text-indigo-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold">
              {t('teacher.aiWizard.uploadStep.analyzing')}
            </span>
          </div>
          <div className="w-full bg-indigo-200/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={isLoading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'text' && !manualText.trim())}
          className="shadow-md shadow-indigo-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('teacher.aiWizard.uploadStep.analyzingBtn')}
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              {t('teacher.aiWizard.uploadStep.extractBtn')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};


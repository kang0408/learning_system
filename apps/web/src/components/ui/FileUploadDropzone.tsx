import React, { useRef, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FileUploadDropzoneProps {
  accept?: string;
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  accept,
  onFileSelect,
  selectedFile,
  title = 'Kéo thả file vào đây hoặc nhấp để chọn file',
  subtitle = 'Hỗ trợ định dạng CSV, XLSX',
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex items-center justify-between p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <File className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 font-semibold">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center',
            isDragOver
              ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-300'
          )}
        >
          <div className="p-3 bg-white rounded-full shadow-sm border border-slate-200 text-indigo-600 mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 mb-1">{title}</p>
          <p className="text-xs font-semibold text-slate-400">{subtitle}</p>
        </div>
      )}
    </div>
  );
};

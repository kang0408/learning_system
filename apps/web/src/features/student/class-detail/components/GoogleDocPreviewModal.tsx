import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  Loader2,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import type { CurriculumMaterial } from '../types/curriculum.types';

interface GoogleDocPreviewModalProps {
  isOpen: boolean;
  material: CurriculumMaterial | null;
  onClose: () => void;
}

export const GoogleDocPreviewModal: React.FC<GoogleDocPreviewModalProps> = ({
  isOpen,
  material,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset loading state when material changes
  useEffect(() => {
    if (material) {
      setIsLoading(true);
      setImageError(false);
    }
  }, [material]);

  if (!isOpen || !material) return null;

  const isImage =
    material.file_type === 'image' ||
    /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(material.file_url) ||
    material.file_url.startsWith('data:image/');

  const isDirectImage =
    (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(material.file_url) ||
      material.file_url.startsWith('data:image/')) &&
    !material.file_url.includes('drive.google.com') &&
    !material.file_url.includes('docs.google.com');

  // Transform standard Google Drive / Docs URLs to embedded preview URLs
  const getEmbedUrl = (rawUrl: string): string => {
    if (!rawUrl) return '';

    // 1. Google Drive file link: /file/d/{id}/view -> /file/d/{id}/preview
    const driveMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    // 2. Google Docs link: /document/d/{id} -> /document/d/{id}/preview
    const docMatch = rawUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (docMatch && docMatch[1]) {
      return `https://docs.google.com/document/d/${docMatch[1]}/preview`;
    }

    // 3. Google Sheets link: /spreadsheets/d/{id} -> /spreadsheets/d/{id}/preview
    const sheetMatch = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetMatch && sheetMatch[1]) {
      return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/preview`;
    }

    // 4. Google Slides link: /presentation/d/{id} -> /presentation/d/{id}/preview
    const slideMatch = rawUrl.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (slideMatch && slideMatch[1]) {
      return `https://docs.google.com/presentation/d/${slideMatch[1]}/preview`;
    }

    // 5. Already preview URL
    if (rawUrl.includes('/preview')) {
      return rawUrl;
    }

    // 6. Generic external PDF/Doc link: Use Google Docs Viewer
    return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
  };

  const embedUrl = getEmbedUrl(material.file_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white border-4 border-zinc-900 shadow-[8px_8px_0_0_#18181b] flex flex-col transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-2 w-auto h-auto rounded-xl z-50'
            : 'w-full max-w-5xl h-[88vh] rounded-2xl'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:px-6 border-b-4 border-zinc-900 bg-zinc-50 flex items-center justify-between gap-4 shrink-0 rounded-t-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 border-2 border-zinc-900 flex items-center justify-center font-mono font-black text-xs shrink-0 uppercase shadow-[2px_2px_0_0_#18181b] ${
                isImage ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'
              }`}
            >
              {isImage ? (
                <ImageIcon className="w-5 h-5" />
              ) : (
                material.file_type || 'DOC'
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${
                    isImage
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {isImage ? 'Hình ảnh / Image' : 'Xem tài liệu / Document Preview'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-900 truncate mt-0.5">
                {material.title}
              </h3>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Open in new tab */}
            <a
              href={material.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-zinc-900 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-mono font-bold uppercase shadow-[2px_2px_0_0_#18181b] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              title="Mở tài liệu trong tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mở tab mới</span>
            </a>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 border-2 border-zinc-900 bg-white hover:bg-zinc-100 text-zinc-900 shadow-[2px_2px_0_0_#18181b] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 border-2 border-zinc-900 bg-red-500 hover:bg-red-600 text-white shadow-[2px_2px_0_0_#18181b] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              title="Đóng xem trước (ESC)"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Content Body / Direct Image or Iframe */}
        <div className="flex-1 relative bg-zinc-950 overflow-hidden flex flex-col items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="font-mono text-xs font-bold uppercase text-zinc-700 tracking-wider">
                {isImage ? 'Đang tải hình ảnh...' : 'Đang tải tài liệu...'}
              </p>
            </div>
          )}

          {isDirectImage ? (
            <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
              {!imageError ? (
                <img
                  src={material.file_url}
                  alt={material.title}
                  className="max-w-full max-h-full object-contain rounded shadow-lg select-none"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setImageError(true);
                  }}
                />
              ) : (
                <div className="text-center text-zinc-400 p-6 space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-sm font-medium">Không thể hiển thị trực tiếp ảnh này.</p>
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 underline font-mono"
                  >
                    Nhấn vào đây để xem ảnh gốc <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <iframe
              src={embedUrl}
              title={material.title}
              className="w-full h-full border-0 bg-white"
              onLoad={() => setIsLoading(false)}
              allow="autoplay"
            />
          )}
        </div>

        {/* Footer info note */}
        <div className="px-4 py-2 bg-zinc-100 border-t-2 border-zinc-900 flex flex-wrap items-center justify-between text-[11px] font-mono font-medium text-zinc-600 rounded-b-xl gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>
              {isDirectImage
                ? 'Đang xem trước hình ảnh trực tiếp'
                : 'Đang xem trực tiếp tài liệu'}
            </span>
          </div>
          <div className="text-zinc-500">
            Không tải được?{' '}
            <a
              href={material.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-indigo-600 underline hover:text-indigo-800"
            >
              Nhấn vào đây để mở trực tiếp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import {
  X,
  Search,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  File,
  Globe,
  Lock,
  Check,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, type SelectOption } from '@/components/ui/Select';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { formatBytes } from '../utils/driveFormatters';
import type { GoogleDriveFile, GoogleDriveFileType } from '../types/drive.types';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: {
    title: string;
    file_url: string;
    file_type: string;
    file_size: number;
    drive_id: string;
  }) => void;
}

const PICKER_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Tất cả định dạng', value: 'all' },
  { label: 'Tài liệu PDF (.pdf)', value: 'pdf' },
  { label: 'Word (.docx)', value: 'docx' },
  { label: 'Slide (.pptx)', value: 'pptx' },
  { label: 'Bảng tính (.xlsx)', value: 'xlsx' },
  { label: 'Hình ảnh', value: 'image' },
];

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
}) => {
  const {
    account,
    allFiles,
    makeFilePublic,
    updatingFileId,
  } = useGoogleDrive();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | GoogleDriveFileType>('all');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = allFiles.filter((f) => {
    if (search.trim() && !f.name.toLowerCase().includes(search.toLowerCase().trim())) {
      return false;
    }
    if (selectedType !== 'all' && f.fileType !== selectedType) {
      return false;
    }
    return true;
  });

  const getFileIcon = (type: GoogleDriveFileType) => {
    switch (type) {
      case 'pdf':
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'docx':
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'xlsx':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        );
      case 'pptx':
        return (
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0 shadow-xs">
            <Presentation className="w-4 h-4" />
          </div>
        );
      case 'image':
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-xs">
            <ImageIcon className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
            <File className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    return formatBytes(bytes);
  };

  const handleSelect = async (file: GoogleDriveFile) => {
    setIsProcessingId(file.id);
    try {
      // If the file is private, auto toggle to public so students can view it
      if (!file.isPublic) {
        await makeFilePublic(file.id);
      }

      onSelectFile({
        title: file.name,
        file_url: file.webViewLink,
        file_type: file.fileType,
        file_size: file.size,
        drive_id: file.id,
      });
      onClose();
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-xs">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Chọn tài liệu từ Google Drive
              </h3>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                {account.isConnected ? account.email : 'Chưa kết nối Google Drive'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Type filter */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
            />
          </div>

          <div className="w-48 shrink-0">
            <Select
              value={selectedType}
              onChange={(val) => setSelectedType(val as any)}
              options={PICKER_TYPE_OPTIONS}
              size="sm"
            />
          </div>
        </div>

        {/* Informational banner */}
        <div className="px-5 py-2.5 bg-indigo-50/60 border-b border-indigo-100/60 flex items-center gap-2 text-xs text-indigo-900 shrink-0 font-medium">
          <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            Tài liệu khi gán vào bài học sẽ được <strong>tự động bật quyền xem công khai</strong> để học sinh mở xem trực tiếp trên bài học.
          </span>
        </div>

        {/* File List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">Không tìm thấy tài liệu nào phù hợp</p>
            </div>
          ) : (
            filtered.map((file) => {
              const isProcessing = isProcessingId === file.id || updatingFileId === file.id;
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:bg-indigo-50/20 bg-white transition-all gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getFileIcon(file.fileType)}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {file.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        {file.isPublic ? (
                          <Badge variant="success" size="sm" className="gap-1 font-semibold">
                            <Globe className="w-3 h-3" /> Đã công khai
                          </Badge>
                        ) : (
                          <Badge variant="secondary" size="sm" className="gap-1 font-semibold">
                            <Lock className="w-3 h-3 text-slate-400" /> Riêng tư
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button
                      type="button"
                      variant={file.isPublic ? 'primary' : 'outline'}
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleSelect(file)}
                      className={
                        file.isPublic
                          ? 'shadow-xs font-semibold'
                          : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 font-semibold'
                      }
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : file.isPublic ? (
                        <Check className="w-3.5 h-3.5 mr-1" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 mr-1" />
                      )}
                      {file.isPublic ? 'Gán vào bài học' : 'Công khai & Gán'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

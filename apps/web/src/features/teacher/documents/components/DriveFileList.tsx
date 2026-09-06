import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  File,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Upload,
  Globe,
  Lock,
  Info,
  X,
  Folder,
  FolderPlus,
  ChevronRight,
  ArrowLeft,
  UploadCloud,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, type SelectOption } from '@/components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { DriveFileVisibilityToggle } from './DriveFileVisibilityToggle';
import { formatBytes } from '../utils/driveFormatters';
import type { GoogleDriveFile, DriveFilterOptions, GoogleDriveFileType } from '../types/drive.types';

interface DriveFileListProps {
  files: GoogleDriveFile[];
  stats: { total: number; publicCount: number; privateCount: number };
  updatingFileId: string | null;
  filters: DriveFilterOptions;
  onFilterChange: (newFilters: DriveFilterOptions) => void;
  onToggleVisibility: (fileId: string) => Promise<boolean>;
  onDeleteFile: (fileId: string) => Promise<any> | void;
  onUploadFile: (file: File, isPublic?: boolean) => Promise<any>;
  currentFolderId: string | null;
  breadcrumbs: Array<{ id: string | null; name: string }>;
  onNavigateToFolder: (folderId: string | null, folderName?: string) => void;
  onCreateFolder: (folderName: string) => Promise<any>;
  isUploadOpenExternal?: boolean;
  setIsUploadOpenExternal?: (open: boolean) => void;
  isFolderOpenExternal?: boolean;
  setIsFolderOpenExternal?: (open: boolean) => void;
}

const FILE_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Tất cả định dạng', value: 'all' },
  { label: 'Thư mục', value: 'folder' },
  { label: 'Tài liệu PDF (.pdf)', value: 'pdf' },
  { label: 'Microsoft Word (.docx)', value: 'docx' },
  { label: 'Microsoft PowerPoint (.pptx)', value: 'pptx' },
  { label: 'Microsoft Excel (.xlsx)', value: 'xlsx' },
  { label: 'Hình ảnh (.png, .jpg)', value: 'image' },
];

export const DriveFileList: React.FC<DriveFileListProps> = ({
  files,
  stats,
  updatingFileId,
  filters,
  onFilterChange,
  onToggleVisibility,
  onDeleteFile,
  onUploadFile,
  currentFolderId,
  breadcrumbs,
  onNavigateToFolder,
  onCreateFolder,
  isUploadOpenExternal,
  setIsUploadOpenExternal,
  isFolderOpenExternal,
  setIsFolderOpenExternal,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete Confirmation State
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPublicUpload, setIsPublicUpload] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder Modal State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Sync external open triggers
  useEffect(() => {
    if (isUploadOpenExternal) {
      setSelectedFile(null);
      setIsUploadModalOpen(true);
      setIsUploadOpenExternal?.(false);
    }
  }, [isUploadOpenExternal, setIsUploadOpenExternal]);

  useEffect(() => {
    if (isFolderOpenExternal) {
      setIsFolderModalOpen(true);
      setIsFolderOpenExternal?.(false);
    }
  }, [isFolderOpenExternal, setIsFolderOpenExternal]);

  const getFileIcon = (type: GoogleDriveFileType) => {
    switch (type) {
      case 'folder':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
            <Folder className="w-4 h-4 fill-amber-500 text-amber-600" />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'docx':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'xlsx':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        );
      case 'pptx':
        return (
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0 shadow-xs">
            <Presentation className="w-4 h-4" />
          </div>
        );
      case 'image':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-xs">
            <ImageIcon className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
            <File className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '—';
    return formatBytes(bytes);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const handleCopyLink = (file: GoogleDriveFile) => {
    const link = file.webViewLink;
    navigator.clipboard.writeText(link);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onUploadFile(selectedFile, isPublicUpload);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Folder creation handler
  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      await onCreateFolder(newFolderName.trim());
      setIsFolderModalOpen(false);
      setNewFolderName('');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteFile(fileToDelete.id);
      setFileToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
      {/* Top Header Row: Breadcrumb Path Navigation */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm min-w-0">
          {currentFolderId && (
            <button
              type="button"
              onClick={() => {
                const parentCrumb = breadcrumbs[breadcrumbs.length - 2];
                onNavigateToFolder(parentCrumb?.id || null, parentCrumb?.name);
              }}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors mr-1 shrink-0"
              title="Quay lại thư mục cha"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id || 'root'}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  {isLast ? (
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs shrink-0 shadow-xs">
                      {idx === 0 ? <Folder className="w-3.5 h-3.5 text-indigo-600" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                      {crumb.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigateToFolder(crumb.id, crumb.name)}
                      className="text-slate-600 hover:text-indigo-600 font-medium hover:underline flex items-center gap-1 text-xs shrink-0 transition-colors"
                    >
                      {idx === 0 && <Folder className="w-3.5 h-3.5 text-indigo-500" />}
                      {crumb.name}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        <span className="text-xs font-mono text-slate-400 shrink-0 hidden sm:inline-block">
          {files.length} mục
        </span>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-3.5 justify-between items-stretch lg:items-center bg-white">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu Google Drive theo tên..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-9 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls: Visibility Pills & File Type Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Visibility Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, visibility: 'all' })}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filters.visibility === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, visibility: 'public' })}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filters.visibility === 'public'
                  ? 'bg-emerald-50 text-emerald-700 shadow-xs font-bold border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3 h-3 text-emerald-600" />
              Công khai ({stats.publicCount})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, visibility: 'private' })}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filters.visibility === 'private'
                  ? 'bg-slate-200 text-slate-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3 h-3 text-slate-500" />
              Riêng tư ({stats.privateCount})
            </button>
          </div>

          {/* File Type Dropdown */}
          <div className="w-48 shrink-0">
            <Select
              value={filters.fileType}
              onChange={(val) => onFilterChange({ ...filters, fileType: val as any })}
              options={FILE_TYPE_OPTIONS}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      {files.length === 0 ? (
        <div className="p-12">
          <EmptyState
            title="Thư mục này hiện đang trống"
            description="Bấm 'Tải tệp từ máy' để tải tài liệu lên hoặc 'Tạo thư mục' để gom nhóm bài học."
            onAction={() => setIsUploadModalOpen(true)}
            actionLabel="Tải tài liệu ngay"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 border-b border-slate-200/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <TableHead className="py-3.5 px-6">Tên tài liệu / Thư mục</TableHead>
                <TableHead className="py-3.5 px-4 w-32 text-center">Kích thước</TableHead>
                <TableHead className="py-3.5 px-4 w-44 text-center">Cập nhật</TableHead>
                <TableHead className="py-3.5 px-4 w-48 text-center">Quyền xem</TableHead>
                <TableHead className="py-3.5 px-6 text-right w-36">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-sm">
              {files.map((file) => {
                const isFolder = file.fileType === 'folder';
                return (
                  <TableRow
                    key={file.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isFolder ? 'cursor-pointer bg-amber-50/15' : ''
                    }`}
                    onClick={() => {
                      if (isFolder) {
                        onNavigateToFolder(file.id, file.name);
                      }
                    }}
                  >
                    {/* Name & Type Icon */}
                    <TableCell className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.fileType)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-semibold truncate max-w-sm sm:max-w-md ${
                                isFolder ? 'text-indigo-900 hover:text-indigo-600 font-bold' : 'text-slate-900'
                              }`}
                            >
                              {file.name}
                            </p>
                            {isFolder && (
                              <Badge variant="warning" size="sm" className="font-semibold text-[10px]">
                                Thư mục
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 uppercase font-mono">
                            {isFolder ? 'Folder' : file.fileType}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Size */}
                    <TableCell className="py-3.5 px-4 text-xs font-mono text-slate-500 text-center">
                      {isFolder ? '—' : formatFileSize(file.size)}
                    </TableCell>

                    {/* Updated At */}
                    <TableCell className="py-3.5 px-4 text-xs font-mono text-slate-500 text-center whitespace-nowrap">
                      {formatDate(file.updatedAt)}
                    </TableCell>

                    {/* Public / Private Visibility Toggle */}
                    <TableCell
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isFolder ? (
                        <span className="text-xs text-slate-400 italic">Thư mục nội bộ</span>
                      ) : (
                        <div className="flex justify-center">
                          <DriveFileVisibilityToggle
                            isPublic={file.isPublic}
                            isLoading={updatingFileId === file.id}
                            onToggle={() => onToggleVisibility(file.id)}
                          />
                        </div>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell
                      className="py-3.5 px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-1">
                        {isFolder ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onNavigateToFolder(file.id, file.name)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1"
                          >
                            Mở
                          </Button>
                        ) : (
                          <>
                            {/* Copy Link Button */}
                            <button
                              type="button"
                              onClick={() => handleCopyLink(file)}
                              title="Sao chép link Google Drive"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              {copiedId === file.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            {/* Open in Google Drive New Tab */}
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Mở trên Google Drive"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </>
                        )}

                        {/* Delete File / Folder */}
                        <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          title={isFolder ? 'Xóa thư mục khỏi Google Drive' : 'Xóa tài liệu khỏi Google Drive'}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Upload File Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Tải tài liệu lên Google Drive
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tải tệp từ máy tính trực tiếp vào {breadcrumbs[breadcrumbs.length - 1]?.name}
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Dropzone / Picker */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.gif,.svg,.zip"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/20 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-indigo-600">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Nhấn để chọn tệp từ máy tính hoặc kéo thả vào đây
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Hỗ trợ PDF, Word, PowerPoint, Excel, Hình ảnh (Tối đa 50MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0 shadow-xs ${
                        selectedFile.type.startsWith('image/') ? 'border-purple-200 text-purple-600' : 'border-indigo-200 text-indigo-600'
                      }`}>
                        {selectedFile.type.startsWith('image/') ? (
                          <ImageIcon className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Chọn tệp khác"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Public Visibility Checkbox Card */}
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    Bật quyền xem công khai (Khuyên dùng)
                  </span>
                  <input
                    type="checkbox"
                    checked={isPublicUpload}
                    onChange={(e) => setIsPublicUpload(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Cho phép học sinh mở và xem trực tiếp tài liệu ngay trên trang học tập khi được gán vào bài học.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!selectedFile || isUploading}
                  className="font-bold shadow-xs"
                >
                  {isUploading ? 'Đang tải lên...' : 'Tải lên Google Drive'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Tạo thư mục mới
                </h3>
              </div>
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên thư mục *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ví dụ: IELTS Listening, Giáo án Unit 1..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                />
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Thư mục sẽ được tạo trực tiếp bên trong <strong>{breadcrumbs[breadcrumbs.length - 1]?.name}</strong> trên Google Drive của bạn.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!newFolderName.trim() || isCreatingFolder}
                  className="font-bold shadow-xs"
                >
                  {isCreatingFolder ? 'Đang tạo...' : 'Tạo thư mục'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-slate-900">
                  {fileToDelete.fileType === 'folder' ? 'Xác nhận xóa thư mục' : 'Xác nhận xóa tài liệu'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                  Bạn có chắc chắn muốn xóa{' '}
                  <strong className="text-slate-800 font-semibold truncate inline-block max-w-[260px] align-bottom">
                    "{fileToDelete.name}"
                  </strong>{' '}
                  khỏi Google Drive không?
                  {fileToDelete.fileType === 'folder' && (
                    <span className="block mt-1.5 text-amber-600 font-medium">
                      * Lưu ý: Thư mục và tất cả các tệp con bên trong sẽ bị xóa trên Google Drive.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="border-slate-200 text-slate-700"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs border-rose-600"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Xóa vĩnh viễn
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

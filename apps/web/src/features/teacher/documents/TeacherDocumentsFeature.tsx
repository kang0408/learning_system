import React from 'react';
import { HardDrive, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { GoogleDriveConnectCard } from './components/GoogleDriveConnectCard';
import { DriveFileList } from './components/DriveFileList';
import { useGoogleDrive } from './hooks/useGoogleDrive';

export const TeacherDocumentsFeature: React.FC = () => {
  const {
    account,
    files,
    stats,
    isLoading,
    updatingFileId,
    filters,
    setFilters,
    currentFolderId,
    breadcrumbs,
    navigateToFolder,
    createFolder,
    connectDrive,
    disconnectDrive,
    toggleFileVisibility,
    deleteFile,
    uploadFile,
    refreshDriveData,
  } = useGoogleDrive();

  return (
    <div className="space-y-8 max-w-8xl mx-auto px-4 sm:px-6 mb-16">
      {/* Header matching Teacher Dashboard Header style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition duration-300">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản lý Tài liệu Google Drive
            </h1>
            <Badge variant="indigo" size="md">
              {stats.total} tài liệu
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Liên kết Google Drive cá nhân, quản lý quyền xem công khai/riêng tư và gán tài liệu vào lộ trình bài học.
          </p>
        </div>

        {/* Status indicator badge */}
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          {account.isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã liên kết Drive</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>Chưa liên kết</span>
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Connection Card */}
      <GoogleDriveConnectCard
        account={account}
        isLoading={isLoading}
        onConnect={() => connectDrive()}
        onDisconnect={disconnectDrive}
        onRefresh={refreshDriveData}
      />

      {/* Drive File List (Rendered when connected) */}
      {account.isConnected && (
        <DriveFileList
          files={files}
          stats={stats}
          updatingFileId={updatingFileId}
          filters={filters}
          onFilterChange={setFilters}
          onToggleVisibility={toggleFileVisibility}
          onDeleteFile={deleteFile}
          onUploadFile={uploadFile}
          currentFolderId={currentFolderId}
          breadcrumbs={breadcrumbs}
          onNavigateToFolder={navigateToFolder}
          onCreateFolder={createFolder}
        />
      )}
    </div>
  );
};

export default TeacherDocumentsFeature;

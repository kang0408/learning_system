import React from 'react';
import { HardDrive, CheckCircle2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header matching Teacher unified style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Quản lý Tài liệu Google Drive
            </h1>
            <Badge variant="indigo" size="md" className="font-bold">
              {stats.total} tài liệu
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Liên kết Google Drive cá nhân, quản lý quyền xem và gán tài liệu vào lộ trình bài học
          </p>
        </div>

        {/* Status Indicator & Sync Action */}
        <div className="flex items-center gap-3 mt-2 md:mt-0">
          {account.isConnected ? (
            <>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã kết nối</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshDriveData()}
                disabled={isLoading}
                className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
                Đồng bộ Drive
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200/80">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>Chưa kết nối</span>
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

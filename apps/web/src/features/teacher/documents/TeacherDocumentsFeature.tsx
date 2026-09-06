import React, { useState } from 'react';
import { HardDrive, Plus, Upload, FolderPlus, RefreshCw, Unplug, CheckCircle2 } from 'lucide-react';
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

  // State to trigger upload/folder modals from header
  const [triggerUpload, setTriggerUpload] = useState(false);
  const [triggerCreateFolder, setTriggerCreateFolder] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      {/* Header matching DashboardHeader and QuestionBankHeader */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Quản lý Tài liệu
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Lưu trữ, phân loại tài liệu Google Drive và quản lý quyền xem bài học cho học sinh.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
          {account.isConnected ? (
            <>
              <Button
                variant="outline"
                size="md"
                className="bg-indigo-50/70 text-indigo-700 border-indigo-200 hover:bg-indigo-100/80 shadow-xs font-semibold"
                onClick={() => setTriggerCreateFolder(true)}
              >
                <FolderPlus className="w-4 h-4 mr-2 text-indigo-600" />
                Tạo thư mục
              </Button>
              <Button
                variant="primary"
                size="md"
                className="shadow-xs font-semibold"
                onClick={() => setTriggerUpload(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Tải tệp từ máy
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => connectDrive()}
              disabled={isLoading}
              className="shadow-xs font-semibold"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <HardDrive className="w-4 h-4 mr-2" />
              )}
              Liên kết Google Drive
            </Button>
          )}
        </div>
      </div>

      {/* Google Drive Connection & Storage Status */}
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
          isUploadOpenExternal={triggerUpload}
          setIsUploadOpenExternal={setTriggerUpload}
          isFolderOpenExternal={triggerCreateFolder}
          setIsFolderOpenExternal={setTriggerCreateFolder}
        />
      )}
    </div>
  );
};

export default TeacherDocumentsFeature;

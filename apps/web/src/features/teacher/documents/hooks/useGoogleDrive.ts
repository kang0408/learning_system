import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/api/axios';
import { toast } from '@/utils/toast';
import type { GoogleDriveFile, GoogleDriveAccount, DriveFilterOptions } from '../types/drive.types';

const STORAGE_KEY_ACCOUNT = 'teacher_gdrive_account';
const STORAGE_KEY_FILES = 'teacher_gdrive_files';

const INITIAL_ACCOUNT: GoogleDriveAccount = {
  isConnected: false,
};

export function useGoogleDrive() {
  const [account, setAccount] = useState<GoogleDriveAccount>(INITIAL_ACCOUNT);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingFileId, setUpdatingFileId] = useState<string | null>(null);

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'Drive của tôi' },
  ]);

  const [filters, setFilters] = useState<DriveFilterOptions>({
    search: '',
    fileType: 'all',
    visibility: 'all',
  });

  // Fetch status and files if connected
  const refreshDriveData = useCallback(async (targetFolderId?: string | null) => {
    try {
      const activeFolder = targetFolderId !== undefined ? targetFolderId : currentFolderId;
      const [statusRes, filesRes] = await Promise.all([
        api.get('/api/integrations/google-drive/status'),
        api.get('/api/integrations/google-drive/files', {
          params: activeFolder ? { folderId: activeFolder } : {},
        }),
      ]);

      if (statusRes.data?.data?.is_connected) {
        setAccount({
          isConnected: true,
          email: statusRes.data.data.email,
          displayName: statusRes.data.data.name,
          avatarUrl: statusRes.data.data.picture,
          storageUsed: statusRes.data.data.storageUsed,
          storageTotal: statusRes.data.data.storageTotal,
        });
      } else {
        setAccount({ isConnected: false });
        setFiles([]);
        localStorage.removeItem(STORAGE_KEY_ACCOUNT);
        localStorage.removeItem(STORAGE_KEY_FILES);
      }

      if (Array.isArray(filesRes.data?.data)) {
        setFiles(filesRes.data.data);
      }
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.data?.error?.includes('Chưa liên kết')) {
        setAccount({ isConnected: false });
        setFiles([]);
        localStorage.removeItem(STORAGE_KEY_ACCOUNT);
        localStorage.removeItem(STORAGE_KEY_FILES);
      }
    }
  }, [currentFolderId]);

  // Navigate into folder
  const navigateToFolder = useCallback(
    (folderId: string | null, folderName?: string) => {
      setCurrentFolderId(folderId);
      if (!folderId) {
        setBreadcrumbs([{ id: null, name: 'Drive của tôi' }]);
      } else {
        setBreadcrumbs((prev) => {
          const index = prev.findIndex((b) => b.id === folderId);
          if (index !== -1) {
            return prev.slice(0, index + 1);
          }
          return [...prev, { id: folderId, name: folderName || 'Thư mục' }];
        });
      }
      refreshDriveData(folderId);
    },
    [refreshDriveData]
  );

  // Check URL parameters for OAuth redirect return (?connected=true&email=...) and verify status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const email = params.get('email');
    const name = params.get('name');
    const error = params.get('error');

    if (error) {
      toast.error(`Lỗi liên kết Google: ${error}`);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (connected === 'true' && email) {
      toast.success(`Đã liên kết thành công với tài khoản Google: ${email}`);
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Always fetch ground truth status from server on mount
    refreshDriveData();
  }, [refreshDriveData]);

  // Connect Google Drive: Calls API to get OAuth URL and REDIRECTS browser to accounts.google.com
  const connectDrive = useCallback(async (customClientId?: unknown) => {
    setIsLoading(true);
    try {
      const validClientId =
        typeof customClientId === 'string' &&
        customClientId.trim() &&
        !customClientId.includes('object Object') &&
        customClientId !== 'undefined'
          ? customClientId.trim()
          : undefined;

      const url = validClientId
        ? `/api/integrations/google-drive/auth-url?client_id=${encodeURIComponent(validClientId)}`
        : '/api/integrations/google-drive/auth-url';

      const res = await api.get(url);
      const data = res.data?.data;

      if (data?.auth_url) {
        window.location.href = data.auth_url;
        return;
      }

      if (!data?.is_configured) {
        const userEnteredClientId = window.prompt(
          'Chưa cấu hình GOOGLE_CLIENT_ID trong file apps/api/.env.\n\nNếu bạn đã tạo Google OAuth Client ID trên Google Cloud Console, vui lòng dán Client ID vào đây để chuyển tới trang đăng nhập của Google:'
        );

        if (userEnteredClientId && userEnteredClientId.trim()) {
          const directUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
            userEnteredClientId.trim()
          )}&redirect_uri=${encodeURIComponent(
            'http://localhost:5000/api/integrations/google-drive/callback'
          )}&response_type=code&scope=${encodeURIComponent(
            'openid email profile https://www.googleapis.com/auth/drive.file'
          )}&access_type=offline&prompt=consent`;

          window.location.href = directUrl;
          return;
        }

        toast.error('Cần có GOOGLE_CLIENT_ID để mở trang xác thực Google Drive.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Không thể lấy đường dẫn xác thực Google Drive.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectDrive = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/api/integrations/google-drive/disconnect').catch(() => {});
      setAccount({ isConnected: false });
      setFiles([]);
      localStorage.removeItem(STORAGE_KEY_ACCOUNT);
      localStorage.removeItem(STORAGE_KEY_FILES);
      toast.success('Đã hủy liên kết Google Drive');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle Public / Private visibility
  const toggleFileVisibility = useCallback(
    async (fileId: string): Promise<boolean> => {
      setUpdatingFileId(fileId);
      try {
        const currentFile = files.find((f) => f.id === fileId);
        const newStatus = !currentFile?.isPublic;

        await api.post('/api/integrations/google-drive/files/visibility', {
          fileId,
          isPublic: newStatus,
        });

        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, isPublic: newStatus } : f))
        );

        toast.success(newStatus ? 'Đã bật công khai xem cho học sinh' : 'Đã chuyển về riêng tư');
        return newStatus;
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.data?.error?.includes('Chưa liên kết')) {
          setAccount({ isConnected: false });
          toast.error('Phiên kết nối Google Drive đã hết hạn. Vui lòng liên kết lại Google Drive.');
        } else {
          toast.error(err?.response?.data?.error || 'Lỗi khi đổi quyền xem');
        }
        return false;
      } finally {
        setUpdatingFileId(null);
      }
    },
    [files]
  );

  // Set file explicitly to public
  const makeFilePublic = useCallback(async (fileId: string): Promise<void> => {
    setUpdatingFileId(fileId);
    try {
      await api.post('/api/integrations/google-drive/files/visibility', {
        fileId,
        isPublic: true,
      });

      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, isPublic: true } : f))
      );
      toast.success('Đã tự động công khai tài liệu để học sinh xem được');
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.data?.error?.includes('Chưa liên kết')) {
        setAccount({ isConnected: false });
        toast.error('Phiên kết nối Google Drive đã hết hạn. Vui lòng liên kết lại Google Drive.');
      }
    } finally {
      setUpdatingFileId(null);
    }
  }, []);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success('Đã xóa tài liệu khỏi danh sách');
  }, []);

  // Upload real file from computer using FormData
  const uploadFile = useCallback(
    async (file: File, isPublic: boolean = true) => {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isPublic', String(isPublic));
        if (currentFolderId) {
          formData.append('folderId', currentFolderId);
        }

        const res = await api.post('/api/integrations/google-drive/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const newFile = res.data?.data;
        if (newFile) {
          setFiles((prev) => [newFile, ...prev]);
          toast.success(`Đã tải lên Google Drive: ${file.name}`);
          refreshDriveData();
          return newFile;
        }
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.data?.error?.includes('Chưa liên kết')) {
          setAccount({ isConnected: false });
          toast.error('Phiên kết nối Google Drive chưa được thiết lập hoặc đã hết hạn. Vui lòng nhấn Liên kết Google Drive.');
        } else {
          toast.error(err?.response?.data?.error || 'Lỗi khi tải tệp lên Google Drive');
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentFolderId, refreshDriveData]
  );

  // Create folder
  const createFolder = useCallback(
    async (folderName: string) => {
      setIsLoading(true);
      try {
        const res = await api.post('/api/integrations/google-drive/folders', {
          name: folderName,
          parentFolderId: currentFolderId || undefined,
        });

        const newFolder = res.data?.data;
        if (newFolder) {
          setFiles((prev) => [newFolder, ...prev]);
          toast.success(`Đã tạo thư mục: ${folderName}`);
          return newFolder;
        }
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.data?.error?.includes('Chưa liên kết')) {
          setAccount({ isConnected: false });
          toast.error('Chưa liên kết Google Drive hoặc phiên làm việc đã hết hạn. Vui lòng nhấn Liên kết Google Drive.');
        } else {
          toast.error(err?.response?.data?.error || 'Lỗi khi tạo thư mục');
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentFolderId]
  );

  // Rename file
  const renameFile = useCallback(async (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, name: newName, updatedAt: new Date().toISOString() } : f
      )
    );
  }, []);

  // Filtered files (folders always stay visible or filtered by search)
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      // Search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        if (!f.name.toLowerCase().includes(query)) return false;
      }
      // If it's a folder, don't filter out by fileType unless specific
      if (f.fileType === 'folder') {
        if (filters.fileType !== 'all' && filters.fileType !== 'folder') return false;
        return true;
      }
      // Type
      if (filters.fileType !== 'all' && f.fileType !== filters.fileType) {
        return false;
      }
      // Visibility
      if (filters.visibility === 'public' && !f.isPublic) return false;
      if (filters.visibility === 'private' && f.isPublic) return false;

      return true;
    });
  }, [files, filters]);

  const stats = useMemo(() => {
    const total = files.filter((f) => f.fileType !== 'folder').length;
    const publicCount = files.filter((f) => f.fileType !== 'folder' && f.isPublic).length;
    const privateCount = total - publicCount;
    return { total, publicCount, privateCount };
  }, [files]);

  return {
    account,
    files: filteredFiles,
    allFiles: files,
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
    makeFilePublic,
    deleteFile,
    uploadFile,
    renameFile,
    refreshDriveData,
  };
}

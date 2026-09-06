export type GoogleDriveFileType = 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'image' | 'video' | 'folder' | 'other';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  fileType: GoogleDriveFileType;
  size: number; // in bytes
  updatedAt: string;
  webViewLink: string;
  embedLink?: string;
  thumbnailLink?: string;
  isPublic: boolean; // True if 'Anyone with the link can view'
  folderId?: string | null;
}

export interface GoogleDriveAccount {
  isConnected: boolean;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  storageUsed?: number; // in bytes
  storageTotal?: number; // in bytes
  connectedAt?: string;
}

export interface DriveFilterOptions {
  search: string;
  fileType: 'all' | GoogleDriveFileType;
  visibility: 'all' | 'public' | 'private';
}

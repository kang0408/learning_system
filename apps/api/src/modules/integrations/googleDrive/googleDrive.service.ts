export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  email?: string;
  name?: string;
  picture?: string;
}

// In-memory token store for development (can be backed by DB/Redis)
const tokenStore = new Map<string, GoogleTokens>();

export class GoogleDriveService {
  private get clientId(): string {
    return (process.env.GOOGLE_CLIENT_ID || '').trim();
  }

  private get clientSecret(): string {
    return (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  }

  private get redirectUri(): string {
    return (
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:5000/api/integrations/google-drive/callback'
    ).trim();
  }

  public isConfigured(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }

  public getAuthUrl(teacherId: string, customClientId?: string): string {
    const clientId = customClientId || this.clientId;
    if (!clientId) {
      throw new Error('Chưa cấu hình GOOGLE_CLIENT_ID');
    }

    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: teacherId,
    });

    // Google OAuth 2.0 RFC 6749 expects space encoding as %20 rather than +
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString().replace(/\+/g, '%20')}`;
  }

  public async exchangeCode(code: string, teacherId: string): Promise<GoogleTokens> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Chưa cấu hình GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET');
    }

    // 1. Exchange code for access & refresh tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = (await tokenRes.json()) as any;
    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Lỗi đổi mã xác thực Google');
    }

    // 2. Fetch Google profile info
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = (await profileRes.json()) as any;

    const tokens: GoogleTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: Date.now() + (tokenData.expires_in || 3600) * 1000,
      email: profileData.email,
      name: profileData.name,
      picture: profileData.picture,
    };

    tokenStore.set(teacherId, tokens);
    return tokens;
  }

  public async getValidAccessToken(teacherId: string): Promise<string | null> {
    const tokens = tokenStore.get(teacherId);
    if (!tokens) return null;

    if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60000 && tokens.refresh_token) {
      try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: tokens.refresh_token,
            grant_type: 'refresh_token',
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          tokens.access_token = data.access_token;
          tokens.expiry_date = Date.now() + (data.expires_in || 3600) * 1000;
          tokenStore.set(teacherId, tokens);
        }
      } catch {
        // use existing
      }
    }
    return tokens.access_token;
  }

  public getTokens(teacherId: string): GoogleTokens | undefined {
    return tokenStore.get(teacherId);
  }

  public saveTokens(teacherId: string, tokens: GoogleTokens): void {
    tokenStore.set(teacherId, tokens);
  }

  public removeTokens(teacherId: string): void {
    tokenStore.delete(teacherId);
  }

  // Get Storage Quota & User Info from Google Drive about.get
  public async getAbout(teacherId: string): Promise<{
    storageUsed: number;
    storageTotal: number;
    email?: string;
    name?: string;
    picture?: string;
  }> {
    const accessToken = await this.getValidAccessToken(teacherId);
    const tokens = tokenStore.get(teacherId);
    if (!accessToken) {
      return { storageUsed: 0, storageTotal: 0 };
    }

    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        return {
          storageUsed: Number(data.storageQuota?.usage) || 0,
          storageTotal: Number(data.storageQuota?.limit) || 15 * 1024 * 1024 * 1024,
          email: data.user?.emailAddress || tokens?.email,
          name: data.user?.displayName || tokens?.name,
          picture: data.user?.photoLink || tokens?.picture,
        };
      }
    } catch {
      // fallback
    }

    return {
      storageUsed: 0,
      storageTotal: 15 * 1024 * 1024 * 1024,
      email: tokens?.email,
      name: tokens?.name,
      picture: tokens?.picture,
    };
  }

  // List files and folders with folder hierarchy support
  public async listFiles(teacherId: string, folderId?: string): Promise<any[]> {
    const accessToken = await this.getValidAccessToken(teacherId);
    if (!accessToken) {
      return [];
    }

    try {
      // Filter by parent folder if specified, otherwise fetch all non-trashed
      let query = 'trashed = false';
      if (folderId && folderId !== 'root') {
        query = `'${folderId}' in parents and trashed = false`;
      }

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          query
        )}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,parents,permissions)&pageSize=100&orderBy=folder,name`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) {
        return [];
      }

      const data = (await res.json()) as any;
      return (data.files || []).map((file: any) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const isPublic = (file.permissions || []).some(
          (p: any) => p.type === 'anyone' && p.role === 'reader'
        );

        let fileType = 'other';
        if (isFolder) fileType = 'folder';
        else if (file.mimeType.includes('pdf')) fileType = 'pdf';
        else if (file.mimeType.includes('word') || file.mimeType.includes('document')) fileType = 'docx';
        else if (file.mimeType.includes('sheet')) fileType = 'xlsx';
        else if (file.mimeType.includes('presentation')) fileType = 'pptx';
        else if (file.mimeType.includes('image')) fileType = 'image';
        else if (file.mimeType.includes('video')) fileType = 'video';

        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          fileType,
          size: Number(file.size) || 0,
          updatedAt: file.modifiedTime || new Date().toISOString(),
          webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
          embedLink: isFolder ? undefined : `https://drive.google.com/file/d/${file.id}/preview`,
          thumbnailLink: file.thumbnailLink,
          isPublic,
          folderId: file.parents?.[0] || null,
        };
      });
    } catch {
      return [];
    }
  }

  // Create a new Folder in Google Drive
  public async createFolder(teacherId: string, folderName: string, parentFolderId?: string): Promise<any> {
    const accessToken = await this.getValidAccessToken(teacherId);
    if (!accessToken) {
      throw new Error('Chưa liên kết Google Drive');
    }

    const payload: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId && parentFolderId !== 'root') {
      payload.parents = [parentFolderId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,modifiedTime,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      throw new Error(data.error?.message || 'Không thể tạo thư mục trên Google Drive');
    }

    return {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
      fileType: 'folder',
      size: 0,
      updatedAt: data.modifiedTime || new Date().toISOString(),
      webViewLink: data.webViewLink || `https://drive.google.com/drive/folders/${data.id}`,
      isPublic: false,
      folderId: parentFolderId || null,
    };
  }

  // Upload real file from computer using Google Drive Multipart Upload
  public async uploadFile(
    teacherId: string,
    file: Express.Multer.File,
    isPublic: boolean,
    parentFolderId?: string
  ): Promise<any> {
    const accessToken = await this.getValidAccessToken(teacherId);
    if (!accessToken) {
      throw new Error('Chưa liên kết Google Drive');
    }

    const boundary = '-------314159265358979323846';
    const metadata: any = {
      name: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
    };
    if (parentFolderId && parentFolderId !== 'root') {
      metadata.parents = [parentFolderId];
    }

    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body = Buffer.concat([
      Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata)),
      Buffer.from(delimiter + `Content-Type: ${file.mimetype || 'application/octet-stream'}\r\n\r\n`),
      file.buffer,
      Buffer.from(closeDelimiter),
    ]);

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    const data = (await res.json()) as any;
    if (!res.ok) {
      throw new Error(data.error?.message || 'Lỗi khi tải tệp lên Google Drive');
    }

    // If public requested, make it readable by anyone with the link
    if (isPublic) {
      await this.setFilePublic(teacherId, data.id, true).catch(() => {});
    }

    let fileType = 'other';
    if (data.mimeType.includes('pdf')) fileType = 'pdf';
    else if (data.mimeType.includes('word') || data.mimeType.includes('document')) fileType = 'docx';
    else if (data.mimeType.includes('sheet')) fileType = 'xlsx';
    else if (data.mimeType.includes('presentation')) fileType = 'pptx';
    else if (data.mimeType.includes('image')) fileType = 'image';
    else if (data.mimeType.includes('video')) fileType = 'video';

    return {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
      fileType,
      size: Number(data.size) || file.size || 0,
      updatedAt: data.modifiedTime || new Date().toISOString(),
      webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
      embedLink: `https://drive.google.com/file/d/${data.id}/preview`,
      thumbnailLink: data.thumbnailLink,
      isPublic,
      folderId: parentFolderId || null,
    };
  }

  public async setFilePublic(teacherId: string, fileId: string, isPublic: boolean): Promise<boolean> {
    const accessToken = await this.getValidAccessToken(teacherId);
    if (!accessToken) {
      throw new Error('Chưa liên kết Google Drive');
    }

    if (isPublic) {
      // Create permission: role='reader', type='anyone'
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
      return res.ok;
    } else {
      // Find anyone permission and delete
      const listRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (listRes.ok) {
        const permData = (await listRes.json()) as any;
        const anyonePerm = (permData.permissions || []).find((p: any) => p.type === 'anyone');
        if (anyonePerm?.id) {
          await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${anyonePerm.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      }
      return true;
    }
  }
}

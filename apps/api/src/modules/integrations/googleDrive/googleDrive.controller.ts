import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { GoogleDriveService } from './googleDrive.service';

export class GoogleDriveController {
  constructor(private readonly service: GoogleDriveService) {}

  getAuthUrl = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId || 'unknown';
    const rawClientId = req.query.client_id;
    const customClientId =
      typeof rawClientId === 'string' &&
      rawClientId.trim() &&
      !rawClientId.includes('object') &&
      rawClientId !== 'undefined'
        ? rawClientId.trim()
        : undefined;

    if (!this.service.isConfigured() && !customClientId) {
      return res.json({
        success: true,
        data: {
          is_configured: false,
          auth_url: null,
          message: 'Chưa cấu hình GOOGLE_CLIENT_ID trong apps/api/.env',
        },
      });
    }

    try {
      const authUrl = this.service.getAuthUrl(teacherId, customClientId);
      return res.json({
        success: true,
        data: {
          is_configured: true,
          auth_url: authUrl,
        },
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  handleCallback = async (req: AuthRequest, res: Response) => {
    const code = req.query.code as string;
    const teacherId = (req.query.state as string) || 'unknown';

    if (!code) {
      return res.redirect('http://localhost:5173/teacher/documents?error=missing_code');
    }

    try {
      const tokens = await this.service.exchangeCode(code, teacherId);
      const email = encodeURIComponent(tokens.email || '');
      const name = encodeURIComponent(tokens.name || '');
      return res.redirect(`http://localhost:5173/teacher/documents?connected=true&email=${email}&name=${name}`);
    } catch (err: any) {
      return res.redirect(`http://localhost:5173/teacher/documents?error=${encodeURIComponent(err.message)}`);
    }
  };

  getStatus = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId || '';
    const tokens = this.service.getTokens(teacherId);

    if (!tokens?.access_token) {
      return res.json({
        success: true,
        data: {
          is_connected: false,
        },
      });
    }

    // Fetch real storage quota & profile from about.get
    const about = await this.service.getAbout(teacherId);

    return res.json({
      success: true,
      data: {
        is_connected: true,
        email: about.email || tokens.email,
        name: about.name || tokens.name,
        picture: about.picture || tokens.picture,
        storageUsed: about.storageUsed,
        storageTotal: about.storageTotal,
      },
    });
  };

  getFiles = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId || '';
    const folderId = (req.query.folderId as string) || undefined;
    const files = await this.service.listFiles(teacherId, folderId);

    return res.json({
      success: true,
      data: files,
    });
  };

  createFolder = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId || '';
    const { name, parentFolderId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Tên thư mục không được để trống' });
    }

    try {
      const folder = await this.service.createFolder(teacherId, name.trim(), parentFolderId);
      return res.json({
        success: true,
        data: folder,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  uploadFile = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId || '';
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy tệp để tải lên' });
    }

    const isPublic = req.body.isPublic === 'true' || req.body.isPublic === true;
    const folderId = (req.body.folderId as string) || undefined;

    try {
      const uploadedFile = await this.service.uploadFile(teacherId, file, isPublic, folderId);
      return res.json({
        success: true,
        data: uploadedFile,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  toggleVisibility = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId || '';
    const { fileId, isPublic } = req.body;

    if (!fileId) {
      return res.status(400).json({ success: false, error: 'Thiếu fileId' });
    }

    const result = await this.service.setFilePublic(teacherId, fileId, !!isPublic);
    return res.json({
      success: true,
      data: { isPublic: result ? !!isPublic : !isPublic },
    });
  };

  disconnect = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId || '';
    this.service.removeTokens(teacherId);

    return res.json({
      success: true,
      data: { is_connected: false },
    });
  };
}

import React, { useState } from 'react';
import { Dialog } from '../../../../components/ui/Dialog';
import { Select } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { Label } from '../../../../components/ui/Label';
import { Button } from '../../../../components/ui/Button';
import { toast } from '../../../../utils/toast';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const CreateUserModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = [
    { label: t('adminUsers.roles.student', 'Học sinh'), value: 'student' },
    { label: t('adminUsers.roles.teacher', 'Giáo viên'), value: 'teacher' },
    { label: t('adminUsers.roles.admin', 'Quản trị viên'), value: 'admin' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
      toast.success(t('adminUsers.createModal.success', 'Tạo người dùng mới thành công!'));
      onClose();
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        phone: '',
        address: '',
      });
    } catch (err: any) {
      console.error('Create user error:', err);
      const errMsg = err.response?.data?.error || t('common.error', 'Có lỗi xảy ra khi tạo người dùng');
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t('adminUsers.createModal.title', 'Tạo người dùng mới')}>
      {error && (
        <div className="mb-4 p-3 bg-rose-50/90 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200 flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div>
          <Label className="mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider block">
            {t('adminUsers.createModal.email', 'Email đăng nhập')} <span className="text-rose-500 font-mono">*</span>
          </Label>
          <Input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
          />
        </div>

        <div>
          <Label className="mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider block">
            {t('adminUsers.createModal.password', 'Mật khẩu khởi tạo')} <span className="text-rose-500 font-mono">*</span>
          </Label>
          <Input
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Tối thiểu 6 ký tự"
            className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm font-mono"
          />
        </div>

        <div>
          <Label className="mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider block">
            {t('adminUsers.createModal.fullName', 'Họ và tên')} <span className="text-rose-500 font-mono">*</span>
          </Label>
          <Input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Nguyễn Văn A"
            className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
          />
        </div>

        <div>
          <Label className="mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider block">
            {t('adminUsers.createModal.role', 'Vai trò hệ thống')} <span className="text-rose-500 font-mono">*</span>
          </Label>
          <Select
            value={formData.role}
            onChange={(val) => setFormData({ ...formData, role: val })}
            options={roleOptions}
            className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {t('adminUsers.createModal.phone', 'Số điện thoại')}
            </Label>
            <Input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0912345678"
              className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm font-mono"
            />
          </div>
          <div>
            <Label className="mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {t('adminUsers.createModal.address', 'Địa chỉ')}
            </Label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Hà Nội"
              className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {t('adminUsers.createModal.cancel', 'Hủy')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs"
          >
            {t('adminUsers.createModal.submit', 'Tạo người dùng')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

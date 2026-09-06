import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserItem } from '../types';
import { useAuthStore } from '../../../../store/authStore';
import { Dialog, ConfirmDialog } from '../../../../components/ui/Dialog';
import { Select } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { Label } from '../../../../components/ui/Label';
import { Button } from '../../../../components/ui/Button';
import { Switch } from '../../../../components/ui/Switch';
import { toast } from '../../../../utils/toast';

interface Props {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
}

export const EditUserModal: React.FC<Props> = ({ isOpen, user, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const currentUser = useAuthStore(state => state.user);
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'student',
    phone: '',
    address: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = [
    { label: t('adminUsers.roles.student', 'Học sinh'), value: 'student' },
    { label: t('adminUsers.roles.teacher', 'Giáo viên'), value: 'teacher' },
    { label: t('adminUsers.roles.admin', 'Quản trị viên'), value: 'admin' },
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        role: user.role || 'student',
        phone: user.phone || '',
        address: user.address || '',
        is_active: user.is_active,
      });
    }
  }, [user]);

  if (!user) return null;

  const isSelf = currentUser?.id === user.id;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmEdit = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(user.id, formData);
      toast.success(t('adminUsers.editModal.success', 'Cập nhật thông tin người dùng thành công!'));
      setShowConfirm(false);
      onClose();
    } catch (err: any) {
      console.error('Update user error:', err);
      const errMsg = err.response?.data?.error || t('common.error', 'Có lỗi xảy ra khi cập nhật người dùng');
      setError(errMsg);
      toast.error(errMsg);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} title={t('adminUsers.editModal.title', 'Chỉnh sửa thông tin người dùng')}>
        <div className="mb-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            {t('adminUsers.editModal.emailReadOnly', 'Email')}
          </span>
          <span className="text-slate-900 font-mono font-semibold text-xs">{user.email}</span>
        </div>

        {isSelf && (
          <div className="mb-4 p-3 bg-amber-50/80 text-amber-800 text-xs font-medium rounded-xl border border-amber-200/80 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{t('adminUsers.editModal.selfEditWarning', 'Bạn đang sửa tài khoản Admin của chính mình.')}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50/90 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {t('adminUsers.editModal.fullName', 'Họ và tên')} <span className="text-rose-500 font-mono">*</span>
            </Label>
            <Input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
            />
          </div>

          <div>
            <Label className="mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {t('adminUsers.editModal.role', 'Vai trò')} <span className="text-rose-500 font-mono">*</span>
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
                {t('adminUsers.editModal.phone', 'Số điện thoại')}
              </Label>
              <Input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm font-mono"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider block">
                {t('adminUsers.editModal.address', 'Địa chỉ')}
              </Label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
              />
            </div>
          </div>

          {/* Active Status Switch Component */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              disabled={isSelf}
              label={t('adminUsers.editModal.status', 'Trạng thái hoạt động')}
              description={t('adminUsers.editModal.statusDesc', 'Cho phép người dùng đăng nhập hệ thống')}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {t('adminUsers.editModal.cancel', 'Hủy')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs"
            >
              {t('adminUsers.editModal.save', 'Lưu thay đổi')}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialog for Edit */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmEdit}
        title={t('adminUsers.confirm.editTitle', 'Xác nhận lưu thay đổi')}
        description={t('adminUsers.confirm.editMessage', `Bạn có chắc chắn muốn cập nhật thông tin cho người dùng ${user.full_name || user.email}?`)}
        confirmText={t('common.confirm', 'Xác nhận lưu')}
        cancelText={t('common.cancel', 'Quay lại')}
        isLoading={loading}
      />
    </>
  );
};

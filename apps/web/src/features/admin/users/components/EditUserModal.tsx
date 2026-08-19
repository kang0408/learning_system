import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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
    { label: 'Học sinh', value: 'student' },
    { label: 'Giáo viên', value: 'teacher' },
    { label: 'Phụ huynh', value: 'parent' },
    { label: 'Quản trị viên', value: 'admin' },
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
      toast.success('Cập nhật thông tin người dùng thành công!');
      setShowConfirm(false);
      onClose();
    } catch (err: any) {
      console.error('Update user error:', err);
      const errMsg = err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật người dùng';
      setError(errMsg);
      toast.error(errMsg);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} title="Cập nhật thông tin người dùng">
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
          Email: <strong className="text-slate-900 font-bold">{user.email}</strong>
        </div>

        {isSelf && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Bạn đang sửa tài khoản Admin của chính mình.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 font-bold text-slate-700">Họ và tên (*)</Label>
            <Input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 font-bold text-slate-700">Vai trò hệ thống (*)</Label>
            <Select
              value={formData.role}
              onChange={(val) => setFormData({ ...formData, role: val })}
              options={roleOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 font-bold text-slate-700">Số điện thoại</Label>
              <Input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 font-bold text-slate-700">Địa chỉ</Label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Active Status Switch Component */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              disabled={isSelf}
              label="Trạng thái kích hoạt (is_active)"
              description="Cho phép người dùng đăng nhập hệ thống"
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialog for Edit */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmEdit}
        title="Xác nhận lưu thay đổi"
        description={`Bạn có chắc chắn muốn cập nhật thông tin và vai trò cho người dùng ${user.full_name || user.email}?`}
        confirmText="Xác nhận lưu"
        cancelText="Quay lại"
        isLoading={loading}
      />
    </>
  );
};

import React, { useState } from 'react';
import { Dialog } from '../../../../components/ui/Dialog';
import { Select } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { Label } from '../../../../components/ui/Label';
import { Button } from '../../../../components/ui/Button';
import { toast } from '../../../../utils/toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const CreateUserModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
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
    { label: 'Học sinh', value: 'student' },
    { label: 'Giáo viên', value: 'teacher' },
    { label: 'Phụ huynh', value: 'parent' },
    { label: 'Quản trị viên', value: 'admin' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
      toast.success('Tạo người dùng mới thành công!');
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
      const errMsg = err.response?.data?.error || 'Có lỗi xảy ra khi tạo người dùng';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Tạo người dùng mới">
      {error && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="mb-1.5 font-bold text-slate-700">Email (*)</Label>
          <Input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
          />
        </div>

        <div>
          <Label className="mb-1.5 font-bold text-slate-700">Mật khẩu (*)</Label>
          <Input
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Tối thiểu 6 ký tự"
          />
        </div>

        <div>
          <Label className="mb-1.5 font-bold text-slate-700">Họ và tên (*)</Label>
          <Input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Nguyễn Văn A"
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
              placeholder="0912345678"
            />
          </div>
          <div>
            <Label className="mb-1.5 font-bold text-slate-700">Địa chỉ</Label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Hà Nội"
            />
          </div>
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
            isLoading={loading}
          >
            Tạo người dùng
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

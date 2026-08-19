import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import type { UserItem } from '../types';
import { Dialog, ConfirmDialog } from '../../../../components/ui/Dialog';
import { Input } from '../../../../components/ui/Input';
import { Label } from '../../../../components/ui/Label';
import { Button } from '../../../../components/ui/Button';
import { toast } from '../../../../utils/toast';

interface Props {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSubmit: (id: string, newPassword: string) => Promise<void>;
}

export const ResetPasswordModal: React.FC<Props> = ({ isOpen, user, onClose, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmReset = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await onSubmit(user.id, newPassword);
      const msg = `Đã đặt lại mật khẩu mới cho ${user.email} thành công!`;
      setSuccessMsg(msg);
      toast.success(msg);
      setShowConfirm(false);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setNewPassword('');
      }, 1500);
    } catch (err: any) {
      console.error('Reset password error:', err);
      const errMsg = err.response?.data?.error || 'Có lỗi xảy ra khi đặt lại mật khẩu';
      setError(errMsg);
      toast.error(errMsg);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} title="Đặt lại mật khẩu người dùng">
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
          Đổi mật khẩu cho: <strong className="text-slate-900 font-bold">{user.full_name || user.email}</strong> ({user.email})
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 font-bold text-slate-700">Mật khẩu mới (*)</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
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
              variant="warning"
            >
              Xác nhận đổi mật khẩu
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialog for Reset Password */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmReset}
        title="Xác nhận đặt lại mật khẩu"
        description={`Bạn có chắc chắn muốn đặt lại mật khẩu mới cho tài khoản ${user.email}?`}
        confirmText="Xác nhận đổi mật khẩu"
        cancelText="Quay lại"
        isDanger={true}
        isLoading={loading}
      />
    </>
  );
};

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      const minLengthErr = t('auth.passwordMinLength', 'Mật khẩu phải có ít nhất 6 ký tự');
      setError(minLengthErr);
      toast.error(minLengthErr);
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
      const errMsg = err.response?.data?.error || t('common.error', 'Có lỗi xảy ra khi đặt lại mật khẩu');
      setError(errMsg);
      toast.error(errMsg);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} title={t('adminUsers.resetModal.title', 'Đặt lại mật khẩu người dùng')}>
        <div className="mb-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            {t('adminUsers.resetModal.forUser', 'Đổi mật khẩu cho')}
          </span>
          <span className="text-slate-900 font-mono font-semibold text-xs">{user.email}</span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50/90 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50/90 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
          <div>
            <Label className="mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {t('adminUsers.resetModal.newPassword', 'Mật khẩu mới')} <span className="text-rose-500 font-mono">*</span>
            </Label>
            <Input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm font-mono tracking-wider"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {t('adminUsers.resetModal.cancel', 'Hủy')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs"
            >
              {t('adminUsers.resetModal.submit', 'Xác nhận đổi mật khẩu')}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialog for Reset Password */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmReset}
        title={t('adminUsers.confirm.resetTitle', 'Xác nhận đặt lại mật khẩu')}
        description={t('adminUsers.confirm.resetMessage', `Bạn có chắc chắn muốn đặt lại mật khẩu mới cho tài khoản ${user.email}?`)}
        confirmText={t('adminUsers.resetModal.submit', 'Xác nhận đổi mật khẩu')}
        cancelText={t('common.cancel', 'Quay lại')}
        isDanger={true}
        isLoading={loading}
      />
    </>
  );
};

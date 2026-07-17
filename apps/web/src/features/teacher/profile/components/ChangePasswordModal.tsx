import React, { useState } from 'react';
import { X, Loader2, KeyRound } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/api/axios';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
    code: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/auth/change-password/send-otp');
      return response.data;
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.patch('/api/auth/change-password', payload);
      return response.data;
    }
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOtp = async () => {
    setMessage(null);
    try {
      const result = await sendOtpMutation.mutateAsync();
      if (result.success) {
        setMessage({ type: 'success', text: 'Mã OTP đã được gửi đến email của bạn.' });
      } else {
        setMessage({ type: 'error', text: result.error || result.message || 'Lỗi khi gửi mã OTP.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.response?.data?.message || 'Lỗi hệ thống khi gửi mã OTP.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (formData.new_password.length < 8) {
      return setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
    }
    if (formData.new_password !== formData.confirm_password) {
      return setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
    }
    if (formData.code.length !== 6) {
      return setMessage({ type: 'error', text: 'Mã OTP không hợp lệ.' });
    }

    try {
      const result = await changePasswordMutation.mutateAsync({
        old_password: formData.old_password,
        new_password: formData.new_password,
        code: formData.code
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Đổi mật khẩu thành công.' });
        setFormData({ old_password: '', new_password: '', confirm_password: '', code: '' });
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || result.message || 'Lỗi khi đổi mật khẩu.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.response?.data?.message || 'Lỗi hệ thống khi đổi mật khẩu.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-500" />
            Đổi mật khẩu
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {message && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                placeholder="Nhập mật khẩu hiện tại"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                placeholder="Tối thiểu 8 ký tự"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                placeholder="Nhập lại mật khẩu mới"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã xác nhận (OTP) <span className="text-red-500">*</span></label>
              <div className="flex gap-3">
                <input
                  type="text"
                  name="code"
                  maxLength={6}
                  value={formData.code}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm tracking-widest text-center"
                  placeholder="------"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendOtpMutation.isPending}
                  className="px-4 py-2.5 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-colors text-sm whitespace-nowrap disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                >
                  {sendOtpMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi mã OTP'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-sm disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowRight, X } from 'lucide-react';
import { useChangePassword, useChangePasswordOtp } from '../hooks/useChangePassword';

export const ChangePasswordForm: React.FC = () => {
  const { t } = useTranslation();
  const { mutateAsync: sendOtp, isPending: isSendingOtp } = useChangePasswordOtp();
  const { mutateAsync: changePassword, isPending: isSubmitting } = useChangePassword();

  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
    code: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOtp = async () => {
    setMessage(null);
    try {
      const result = await sendOtp();
      if (result.success) {
        setMessage({ type: 'success', text: t('student.profile.otpSentSuccess') });
      } else {
        setMessage({ type: 'error', text: result.error || result.message || t('student.profile.otpSentError') });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.response?.data?.message || t('student.profile.otpSystemError') });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (formData.new_password.length < 8) {
      return setMessage({ type: 'error', text: t('student.profile.newPasswordMinLength') });
    }

    if (formData.new_password !== formData.confirm_password) {
      return setMessage({ type: 'error', text: t('student.profile.passwordMismatch') });
    }

    if (formData.code.length !== 6) {
      return setMessage({ type: 'error', text: t('student.profile.otpLengthError') });
    }

    try {
      const result = await changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
        code: formData.code
      });

      if (result.success) {
        setMessage({ type: 'success', text: t('student.profile.changePasswordSuccess') });
        setFormData({ old_password: '', new_password: '', confirm_password: '', code: '' });
      } else {
        setMessage({ type: 'error', text: result.error || result.message || t('student.profile.changePasswordError') });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.response?.data?.message || t('student.profile.systemError') });
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 p-8 border-4 border-zinc-900 bg-amber-100 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-2">{t('student.profile.changePasswordTitle')}</h2>
        <p className="text-lg font-medium text-zinc-700">{t('student.profile.changePasswordSubtitle')}</p>
      </div>

      {message && (
        <div className={`p-4 border-2 font-bold flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-green-50 text-green-900 border-green-900'
            : 'bg-red-50 text-red-900 border-red-900'
        }`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="font-black uppercase tracking-widest text-sm text-zinc-900">
            {t('student.profile.currentPassword')}
          </label>
          <input
            type="password"
            name="old_password"
            value={formData.old_password}
            onChange={handleChange}
            placeholder={t('student.profile.currentPasswordPlaceholder')}
            className="w-full px-5 py-4 bg-white border-2 border-zinc-900 text-lg font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-black uppercase tracking-widest text-sm text-zinc-900">
              {t('student.profile.newPassword')}
            </label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              placeholder={t('student.profile.newPasswordPlaceholder')}
              className="w-full px-5 py-4 bg-white border-2 border-zinc-900 text-lg font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-black uppercase tracking-widest text-sm text-zinc-900">
              {t('student.profile.confirmPassword')}
            </label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder={t('student.profile.confirmPasswordPlaceholder')}
              className="w-full px-5 py-4 bg-white border-2 border-zinc-900 text-lg font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-black uppercase tracking-widest text-sm text-zinc-900">
            {t('student.profile.otpLabel')}
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              name="code"
              maxLength={6}
              value={formData.code}
              onChange={handleChange}
              placeholder={t('student.profile.otpPlaceholder')}
              className="flex-1 px-5 py-4 bg-white border-2 border-zinc-900 text-lg font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] text-center tracking-[0.5em]"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp}
              className="px-6 py-4 border-2 border-zinc-900 bg-white text-zinc-900 text-lg font-black uppercase tracking-widest disabled:opacity-70 transition-all hover:bg-zinc-100 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              {isSendingOtp ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('student.profile.sendOtp')}
            </button>
          </div>
        </div>

        <div className="pt-6 mt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full inline-flex items-center justify-center gap-4 px-8 py-5 border-2 border-zinc-900 bg-zinc-900 text-white text-xl font-black uppercase tracking-widest disabled:opacity-70 transition-all hover:bg-zinc-800 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] hover:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[4px] hover:translate-y-[4px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {t('student.profile.processing')}
              </>
            ) : (
              <>
                {t('student.profile.saveNewPassword')}
                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

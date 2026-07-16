import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForgotPassword } from '../hooks/useForgotPassword';

export const ForgotPasswordForm: React.FC = () => {
  const { t } = useTranslation();
  const { step, setStep, loading, error, setError, email, handleSendOtp, handleVerifyOtp, handleResetPassword } = useForgotPassword();
  const [inputEmail, setInputEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError(t('auth.forgotPassword.errorEmail'));
    handleSendOtp(inputEmail);
  };

  const onSubmitStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return setError(t('auth.forgotPassword.errorOtp'));
    handleVerifyOtp(otpCode);
  };

  const onSubmitStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError(t('auth.forgotPassword.errorPassword'));
    if (newPassword !== confirmPassword) return setError(t('auth.forgotPassword.errorConfirmPassword'));
    handleResetPassword(newPassword);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={onSubmitStep1} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t('auth.forgotPassword.emailLabel')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300"
                placeholder={t('auth.forgotPassword.emailPlaceholder')}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-zinc-900/20 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>{t('auth.forgotPassword.submitStep1')}</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={onSubmitStep2} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-4 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-100 mb-6 text-sm">
            {t('auth.forgotPassword.otpMessage')}<strong>{email}</strong>.
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t('auth.forgotPassword.otpLabel')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ShieldCheck className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 text-center tracking-[0.5em] text-lg font-bold"
                placeholder={t('auth.forgotPassword.otpPlaceholder')}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setStep(1); setOtpCode(''); setError(''); }}
              disabled={loading}
              className="flex items-center justify-center py-3.5 px-4 bg-white border border-zinc-200 text-zinc-700 rounded-2xl font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{t('auth.forgotPassword.submitStep2')}</span>}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={onSubmitStep3} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t('auth.forgotPassword.newPasswordLabel')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300"
                placeholder={t('auth.forgotPassword.newPasswordPlaceholder')}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t('auth.forgotPassword.confirmPasswordLabel')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300"
                placeholder={t('auth.forgotPassword.confirmPasswordPlaceholder')}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{t('auth.forgotPassword.submitStep3')}</span>}
          </button>
        </form>
      )}
    </div>
  );
};

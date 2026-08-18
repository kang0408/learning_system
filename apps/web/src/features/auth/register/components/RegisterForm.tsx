import React, { useState } from 'react';
import { User, Mail, Lock, Loader2, ArrowRight, ShieldCheck, ArrowLeft, Users, GraduationCap, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRegister } from '../hooks/useRegister';
import { AuthSelect } from '../../components/AuthSelect';

export const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [otpCode, setOtpCode] = useState('');

  const { step, loading, error, setError, handleSendOtp, handleRegister, setStep } = useRegister();
  const { t } = useTranslation();

  const getPasswordStrength = () => {
    let strength = 0;
    if (password.length > 5) strength += 1;
    if (password.length > 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const strength = getPasswordStrength();
  
  const strengthConfig = [
    { label: t('auth.register.passwordStrengthWeak'), color: 'bg-red-500', text: 'text-red-500', width: 'w-1/4' },
    { label: t('auth.register.passwordStrengthFair'), color: 'bg-yellow-500', text: 'text-yellow-500', width: 'w-2/4' },
    { label: t('auth.register.passwordStrengthGood'), color: 'bg-blue-500', text: 'text-blue-500', width: 'w-3/4' },
    { label: t('auth.register.passwordStrengthStrong'), color: 'bg-green-500', text: 'text-green-500', width: 'w-full' },
  ];

  const currentStrength = strength > 0 ? strengthConfig[Math.min(strength - 1, 3)] : { label: '', color: 'bg-zinc-200', text: 'text-zinc-500', width: 'w-0' };

  const onSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(t('auth.register.errorName'));
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError(t('auth.register.errorEmail'));
    if (password.length < 6) return setError(t('auth.register.errorPassword'));
    if (password !== confirmPassword) return setError(t('auth.register.errorConfirmPassword'));
    handleSendOtp(email);
  };

  const onSubmitStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return setError(t('auth.register.errorOtp'));
    handleRegister({ full_name: name, email, password, role, code: otpCode });
  };

  const roleOptions = [
    { label: t('auth.register.roleStudent'), value: 'student', icon: <GraduationCap className="w-4 h-4" /> },
    { label: t('auth.register.roleTeacher'), value: 'teacher', icon: <Briefcase className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={onSubmitStep1} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t('auth.register.roleLabel')}</label>
            <AuthSelect
              value={role}
              onChange={(val) => setRole(val)}
              options={roleOptions}
              icon={<Users className="h-5 w-5" />}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t('auth.register.nameLabel')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300"
                placeholder={t('auth.register.namePlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t('auth.register.emailLabel')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300"
                placeholder={t('auth.register.emailPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t('auth.register.passwordLabel')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300"
                placeholder={t('auth.register.passwordPlaceholder')}
              />
            </div>
            {password.length > 0 && (
              <div className="pt-2 animate-in fade-in duration-300">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-zinc-500">{t('auth.register.passwordStrengthLabel')}</span>
                  <span className={currentStrength.text}>{currentStrength.label}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`${currentStrength.color} ${currentStrength.width} h-full rounded-full transition-all duration-500 ease-out`} 
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t('auth.register.confirmPasswordLabel')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300"
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group mt-2 w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-zinc-900/20 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{t('auth.register.submitStep1')}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmitStep2} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-4 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-100 mb-6 text-sm">
            {t('auth.register.otpMessage')}<strong>{email}</strong>{t('auth.register.otpMessageSuffix')}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t('auth.register.otpLabel')}</label>
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
                placeholder={t('auth.register.otpPlaceholder')}
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
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>{t('auth.register.submitStep2')}</span>
              )}
            </button>
          </div>
          
          <div className="text-center mt-4">
             <button
              type="button"
              onClick={() => handleSendOtp(email)}
              disabled={loading}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-700 disabled:opacity-50 transition-colors"
            >
              {t('auth.register.resendOtp')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

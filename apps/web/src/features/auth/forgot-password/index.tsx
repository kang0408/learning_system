import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { AuthLayout } from '../components/AuthLayout';

export const ForgotPasswordFeature: React.FC = () => {
  const { t } = useTranslation();
  return (
    <AuthLayout>
      <div className="sm:mx-auto sm:w-full sm:max-w-[440px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white shadow-xl shadow-zinc-200/50 mb-6 border border-zinc-100">
            <img src="/favicon.svg" alt="Logo" className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            {t('auth.forgotPassword.title')}
          </h2>
          <p className="mt-3 text-base text-zinc-500">
            {t('auth.forgotPassword.rememberPassword')}{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              {t('auth.forgotPassword.loginNow')}
            </Link>
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl py-10 px-8 rounded-[2rem] shadow-2xl shadow-zinc-200/50 border border-white">
          <ForgotPasswordForm />
        </div>
      </div>
    </AuthLayout>
  );
};

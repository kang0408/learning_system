import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoginForm } from './components/LoginForm';
import { AuthLayout } from '../components/AuthLayout';

export const LoginFeature: React.FC = () => {
  const { t } = useTranslation();
  return (
    <AuthLayout>
      <div className="sm:mx-auto sm:w-full sm:max-w-[440px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-xl shadow-zinc-200/50 mb-6 border border-zinc-100">
            <img src="/favicon.svg" alt="Logo" className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            {t('auth.login.title')}
          </h2>
          <p className="mt-3 text-base text-zinc-500">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              {t('auth.login.registerNow')}
            </Link>
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl py-10 px-8 rounded-[2rem] shadow-2xl shadow-zinc-200/50 border border-white">
          <LoginForm />
          
          <div className="mt-8 text-center">
            <Link to="/forgot-password" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

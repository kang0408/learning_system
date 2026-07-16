import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      {children}

      {/* Language Switcher */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-1 bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-zinc-200/50">
        <div className="pl-2 pr-1 text-zinc-400">
          <Globe className="w-4 h-4" />
        </div>
        <button
          onClick={() => toggleLanguage('vi')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            i18n.language === 'vi' || !i18n.language
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          VI
        </button>
        <button
          onClick={() => toggleLanguage('en')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            i18n.language === 'en'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
};

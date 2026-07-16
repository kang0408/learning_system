import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, BookOpen, Brain, LogOut, Menu, X, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

export default function StudentLayout() {
  const { logout, login, user, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (token) {
      api.get('/api/users/me').then(res => {
        if (res.data?.data) {
          login(token, res.data.data);
        }
      }).catch(err => {
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      });
    }
  }, [token, login, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/student', icon: Home, label: t('student.menu.dashboard'), end: true },
    { to: '/student/classes', icon: BookOpen, label: t('student.menu.classes') },
    { to: '/quiz', icon: Brain, label: t('student.menu.practice') },
    { to: '/student/profile', icon: User, label: t('student.menu.profile') },
  ];

  const isImmersiveMode = location.pathname.includes('/quiz') || location.pathname.includes('/session-result');

  if (isImmersiveMode) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] font-sans text-zinc-900">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-zinc-900 selection:bg-indigo-600 selection:text-white">
      {/* Brutalist / Minimal Header */}
      <header className="sticky top-0 z-40 w-full bg-[#FDFBF7] border-b-2 border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/student" className="font-black text-2xl tracking-tighter uppercase hover:opacity-80 transition-opacity">Memo<span className="text-indigo-600">zy.</span></Link>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => i18n.changeLanguage(i18n.language?.startsWith('en') ? 'vi' : 'en')}
              className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-zinc-900 font-bold hover:bg-zinc-900 hover:text-[#FDFBF7] transition-colors uppercase text-sm"
              title={i18n.language?.startsWith('en') ? 'Chuyển sang tiếng Việt' : 'Switch to English'}
            >
              {i18n.language?.startsWith('en') ? 'EN' : 'VI'}
            </button>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:text-indigo-600 transition-colors"
            >
              {t('student.menu.open')} <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Menu Overlay - High Impact Brand Color */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-indigo-600 text-white flex flex-col animate-in fade-in duration-300">
          <div className="px-6 h-20 flex items-center justify-between border-b border-indigo-500">
            <Link to="/student" onClick={() => setIsMenuOpen(false)} className="font-black text-2xl tracking-tighter uppercase hover:opacity-80 transition-opacity">Memozy.</Link>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:text-indigo-200 transition-colors"
            >
              {t('student.menu.close')} <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-12 flex flex-col justify-between max-w-7xl mx-auto w-full">
            <nav className="flex flex-col gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-6 text-4xl sm:text-6xl font-black tracking-tighter transition-all ${
                        isActive
                          ? 'text-white translate-x-4'
                          : 'text-indigo-200 hover:text-white hover:translate-x-2'
                      }`
                    }
                  >
                    <Icon className={`w-8 h-8 sm:w-12 sm:h-12 ${item.to === location.pathname ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'} transition-opacity`} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 border-t border-indigo-500 pt-8 mt-12">
              <div>
                <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-2">{t('student.menu.currentUser')}</p>
                <p className="font-medium text-xl">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 font-bold uppercase tracking-widest text-sm text-indigo-200 hover:text-white transition-colors"
              >
                {t('student.menu.logout')} <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Users, FileText, LogOut, Menu, X, User as UserIcon, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { NotificationProvider } from '../components/ui/NotificationProvider';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { Tooltip } from '../components/ui/Tooltip';
import { Button } from '../components/ui/Button';

export default function TeacherLayout() {
  const { logout, login, user, token } = useAuthStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('teacher_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('teacher_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

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
    { to: '/teacher/classes', icon: Users, label: t('layout.teacher.nav.classes') },
    { to: '/teacher/questions', icon: FileText, label: t('layout.teacher.nav.questionBank') },
    { to: '/teacher/profile', icon: UserIcon, label: t('layout.teacher.nav.profile') },
  ];

  const avatarUrl = user?.avatar_url ? `${import.meta.env.VITE_API_URL}${user.avatar_url}` : undefined;

  return (
    <div className="flex h-screen bg-slate-100/75 text-slate-800 font-sans antialiased overflow-hidden selection:bg-indigo-600 selection:text-white">
      <NotificationProvider />

      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 z-50 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
            <img src="/favicon.svg" alt="Logo" className="w-5 h-5" />
          </div>
          <span className="font-extrabold tracking-tight text-lg text-slate-900">Memozy</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 bg-slate-100/80 text-slate-800 rounded-xl hover:bg-slate-200/80 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/25 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Seamless / No background on desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-slate-100/95 backdrop-blur-md md:bg-transparent border-r border-slate-200/60 md:border-r-0 transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        md:relative md:translate-x-0 pt-16 md:pt-0 flex flex-col justify-between py-3 pl-3 pr-2 md:py-3.5 md:pl-3.5 md:pr-2.5
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'w-20 overflow-visible' : 'w-64'}
      `}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Area */}
          <div className={`hidden md:flex h-16 items-center relative mb-1 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-2'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-white p-2 rounded-2xl shadow-xs border border-slate-200/70 flex-shrink-0">
                <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-28 opacity-100'}`}>
                <span className="font-extrabold tracking-tight text-xl text-slate-900 whitespace-nowrap">
                  Memozy
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-1.5 rounded-xl bg-white/80 border border-slate-200/70 shadow-xs text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 transition-all z-50 ${
                isSidebarCollapsed 
                  ? 'absolute -right-3 top-1/2 -translate-y-1/2' 
                  : 'relative'
              }`}
              title={isSidebarCollapsed ? t('layout.teacher.tooltips.expand', 'Mở rộng') : t('layout.teacher.tooltips.collapse', 'Thu gọn')}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* User Profile Snippet */}
          <div className={`mb-3 ${isSidebarCollapsed ? 'px-0 overflow-visible' : 'px-1'}`}>
            <div className={`bg-white/70 hover:bg-white/95 rounded-2xl p-2.5 border border-slate-200/70 shadow-xs flex items-center transition-all duration-200 ${isSidebarCollapsed ? 'justify-center overflow-visible' : 'gap-3'}`}>
              <Tooltip content={isSidebarCollapsed ? (user?.full_name || user?.email) : undefined} position="right" className={isSidebarCollapsed ? 'w-full flex justify-center' : ''}>
                <Avatar size="md" className="ring-2 ring-indigo-500/20">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={user?.full_name || user?.email} />}
                  <AvatarFallback name={user?.full_name || user?.email} />
                </Avatar>
              </Tooltip>
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-center ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 min-w-0 opacity-100'}`}>
                <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider mb-0.5 whitespace-nowrap">
                  {t('layout.teacher.tooltips.role')}
                </p>
                <p className="font-bold text-slate-900 truncate text-xs whitespace-nowrap">{user?.full_name || user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className={`flex-1 ${isSidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'}`}>
            <nav className="space-y-1.5 flex flex-col w-full px-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Tooltip key={item.to} content={isSidebarCollapsed ? item.label : undefined} position="right" className="w-full flex">
                    <NavLink
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `relative flex items-center ${
                          isSidebarCollapsed ? 'justify-center px-0 py-3' : 'px-3.5 py-2.5'
                        } text-sm font-semibold rounded-2xl transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group w-full border ${
                          isActive
                            ? 'bg-white text-indigo-600 shadow-sm border-slate-200/80 shadow-indigo-950/5'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={`w-5 h-5 transition-transform duration-200 ease-out flex-shrink-0 ${!isSidebarCollapsed ? 'mr-3' : ''} ${
                            isActive ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-indigo-600 group-hover:scale-105'
                          }`} />
                          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
                            {item.label}
                          </div>
                          {isActive && !isSidebarCollapsed && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-2" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </Tooltip>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Actions & Utilities */}
        <div className={`pt-3 border-t border-slate-200/50 flex flex-col gap-2 ${isSidebarCollapsed ? 'px-0 overflow-visible' : 'px-1'}`}>
          <Tooltip content={isSidebarCollapsed ? (i18n.language === 'en' ? t('layout.teacher.tooltips.vietnamese') : t('layout.teacher.tooltips.english')) : undefined} position="right" className="w-full flex">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'vi' : 'en')}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5'} py-2.5 text-sm font-semibold text-slate-600 bg-white/70 hover:bg-white hover:text-slate-900 border border-slate-200/60 rounded-2xl transition-all shadow-xs group w-full`}
            >
              <Globe className={`w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap flex items-center justify-between ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
                <span>{t('layout.teacher.language')}</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                  {i18n.language === 'en' ? 'EN' : 'VI'}
                </span>
              </div>
            </button>
          </Tooltip>

          <Tooltip content={isSidebarCollapsed ? t('layout.teacher.tooltips.logout') : undefined} position="right" className="w-full flex">
            <button
              onClick={handleLogout}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5'} py-2.5 text-sm font-semibold text-slate-600 bg-white/70 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200/60 rounded-2xl transition-all shadow-xs group w-full`}
            >
              <LogOut className={`w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors flex-shrink-0 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap text-left ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
                {t('layout.teacher.logout')}
              </div>
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* Main Content (Rounded White Floating Card) */}
      <main className="flex-1 h-screen overflow-hidden p-2 sm:p-3 md:p-3.5 md:pl-0 pt-16 md:pt-3.5 flex flex-col min-w-0">
        <div className="flex-1 bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs shadow-slate-200/50 overflow-y-auto relative flex flex-col">
          <div className="p-4 sm:p-6 md:p-8 max-w-8xl mx-auto w-full flex-1 flex flex-col">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}


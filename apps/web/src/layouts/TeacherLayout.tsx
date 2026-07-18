import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Users, FileText, LogOut, Menu, X, GraduationCap, Sparkles, User as UserIcon, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { NotificationProvider } from '../components/ui/NotificationProvider';

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

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <NotificationProvider />
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <img src="/favicon.svg" alt="Logo" className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-lg bg-clip-text text-transparent bg-slate-900">Memozy</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-100 text-slate-900 rounded-lg">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-white shadow-xl shadow-slate-900/5 border-r border-gray-100 transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        md:relative md:translate-x-0 pt-16 md:pt-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'w-20' : 'w-72'}
      `}>
        {/* Logo Area */}
        <div className={`hidden md:flex h-20 items-center border-b border-gray-50 bg-white relative ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex-shrink-0">
              <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-24 opacity-100'}`}>
              <span className="font-bold tracking-tight text-2xl bg-clip-text text-transparent bg-slate-900 whitespace-nowrap">
                Memozy
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-slate-900 hover:bg-slate-100 transition-colors z-50 ${isSidebarCollapsed ? 'absolute -right-3 top-6 bg-white border border-gray-200 shadow-sm rounded-full' : ''}`}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User Info */}
        <div className={`p-4 ${isSidebarCollapsed ? 'px-2' : 'p-6'}`}>
          <div className={`bg-slate-100/50 rounded-xl p-3 border border-slate-200/50 flex items-center mb-2 ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            {user?.avatar_url ? (
              <img 
                src={`${import.meta.env.VITE_API_URL}${user.avatar_url}`} 
                alt="Avatar" 
                className="w-10 h-10 flex-shrink-0 rounded-full object-cover shadow-sm border border-slate-200"
                title={user?.full_name || user?.email}
              />
            ) : (
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold shadow-sm" title={user?.full_name || user?.email}>
                {(user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'T').toUpperCase()}
              </div>
            )}
            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col justify-center ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'}`}>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5 flex items-center gap-1 whitespace-nowrap">
                <Sparkles className="w-3 h-3 flex-shrink-0" /> {t('layout.teacher.tooltips.role')}
              </p>
              <p className="font-semibold text-gray-900 truncate text-sm whitespace-nowrap">{user?.full_name || user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 overflow-y-auto overflow-x-hidden">
          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'h-0 opacity-0 mb-0' : 'h-6 opacity-100 mb-3'}`}>
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              {t('layout.teacher.menuTitle')}
            </p>
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3 text-sm font-bold rounded-xl transition-all duration-300 group ${isActive
                      ? 'bg-slate-900 text-white shadow-sm border border-slate-900 ' + (!isSidebarCollapsed ? 'translate-x-1' : '')
                      : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 transition-colors flex-shrink-0 ${!isSidebarCollapsed ? 'mr-3' : ''} ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-slate-900'}`} />
                      <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-32 opacity-100'}`}>
                        {item.label}
                      </div>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Actions */}
        <div className={`p-4 border-t border-gray-50 bg-gray-50/30 flex flex-col gap-2 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'vi' : 'en')}
            title={isSidebarCollapsed ? (i18n.language === 'en' ? t('layout.teacher.tooltips.vietnamese') : t('layout.teacher.tooltips.english')) : undefined}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm group`}
          >
            <Globe className={`w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap flex items-center justify-between ${isSidebarCollapsed ? 'w-0 opacity-0' : 'flex-1 opacity-100'}`}>
              <span>{t('layout.teacher.language')}</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                {i18n.language === 'en' ? 'EN' : 'VI'}
              </span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? t('layout.teacher.tooltips.logout') : undefined}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 w-full transition-all shadow-sm group`}
          >
            <LogOut className={`w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors flex-shrink-0 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap text-left ${isSidebarCollapsed ? 'w-0 opacity-0' : 'flex-1 opacity-100'}`}>
              {t('layout.teacher.logout')}
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-slate-50 -z-10 pointer-events-none" />
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

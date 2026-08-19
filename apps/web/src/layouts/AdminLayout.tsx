import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Activity, Users, LogOut, Menu, X, ChevronLeft, ChevronRight, Globe, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { NotificationProvider } from '../components/ui/NotificationProvider';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { Tooltip } from '../components/ui/Tooltip';
import { Button } from '../components/ui/Button';

export default function AdminLayout() {
  const { logout, login, user, token } = useAuthStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', String(isSidebarCollapsed));
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
    { to: '/admin/system', icon: Activity, label: t('layout.admin.nav.system', 'Theo dõi hệ thống') },
    { to: '/admin/users', icon: Users, label: t('layout.admin.nav.users', 'Quản lý người dùng') },
  ];

  const avatarUrl = user?.avatar_url ? `${import.meta.env.VITE_API_URL}${user.avatar_url}` : undefined;

  return (
    <div className="flex h-screen bg-slate-50/50 font-sans">
      <NotificationProvider />
      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm text-white">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-lg text-slate-900">Memozy Admin</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 bg-slate-100 text-slate-900 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-white shadow-xl shadow-slate-900/5 border-r border-slate-200 transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        md:relative md:translate-x-0 pt-16 md:pt-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'w-20 overflow-visible' : 'w-72'}
      `}>
        {/* Logo Area */}
        <div className={`hidden md:flex h-20 items-center border-b border-slate-100 bg-white relative ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md text-white flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-32 opacity-100'}`}>
              <span className="font-extrabold tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 whitespace-nowrap">
                Memozy Admin
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all z-50 ${
              isSidebarCollapsed 
                ? 'absolute -right-3.5 top-1/2 -translate-y-1/2' 
                : 'relative hover:border-slate-300'
            }`}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Admin User Info */}
        <div className={`p-4 ${isSidebarCollapsed ? 'px-2 overflow-visible' : 'p-6'}`}>
          <div className={`bg-indigo-50/60 rounded-2xl p-3 border border-indigo-100 flex items-center mb-2 ${isSidebarCollapsed ? 'justify-center overflow-visible' : 'gap-3'}`}>
            <Tooltip content={isSidebarCollapsed ? (user?.full_name || user?.email) : undefined} position="right" className={isSidebarCollapsed ? 'w-full flex justify-center' : ''}>
              <Avatar size="md" className="ring-2 ring-indigo-500/20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={user?.full_name || user?.email} />}
                <AvatarFallback name={user?.full_name || user?.email} />
              </Avatar>
            </Tooltip>
            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col justify-center ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 min-w-0 opacity-100'}`}>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5 flex items-center gap-1 whitespace-nowrap">
                <Shield className="w-3 h-3 text-indigo-600 inline" /> SYSTEM ADMIN
              </p>
              <p className="font-bold text-slate-900 truncate text-sm whitespace-nowrap">{user?.full_name || user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className={`flex-1 px-3 ${isSidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'}`}>
          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'h-0 opacity-0 mb-0 hidden' : 'h-6 opacity-100 mb-3'}`}>
            <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              {t('layout.admin.menuTitle', 'HỆ THỐNG QUẢN TRỊ')}
            </p>
          </div>
          <nav className="space-y-1.5 flex flex-col w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.to} content={isSidebarCollapsed ? item.label : undefined} position="right" className="w-full flex">
                  <NavLink
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3 text-sm font-bold rounded-xl transition-all duration-150 group w-full border ${isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 border-transparent'
                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-5 h-5 transition-colors flex-shrink-0 ${!isSidebarCollapsed ? 'mr-3' : ''} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                        <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
                          {item.label}
                        </div>
                      </>
                    )}
                  </NavLink>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Actions & Language */}
        <div className={`p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2 ${isSidebarCollapsed ? 'px-2 overflow-visible' : ''}`}>
          <Tooltip content={isSidebarCollapsed ? (i18n.language === 'en' ? 'Tiếng Việt' : 'English') : undefined} position="right" className="w-full flex">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'vi' : 'en')}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm group w-full`}
            >
              <Globe className={`w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap flex items-center justify-between ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
                <span>Ngôn ngữ</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                  {i18n.language === 'en' ? 'EN' : 'VI'}
                </span>
              </div>
            </button>
          </Tooltip>

          <Tooltip content={isSidebarCollapsed ? 'Đăng xuất' : undefined} position="right" className="w-full flex">
            <button
              onClick={handleLogout}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 w-full transition-colors shadow-sm group`}
            >
              <LogOut className={`w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors flex-shrink-0 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap text-left ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
                Đăng xuất
              </div>
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 relative">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

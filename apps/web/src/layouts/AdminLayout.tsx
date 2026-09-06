import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
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
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{ top: number; height: number; opacity: number }>({
    top: 0,
    height: 0,
    opacity: 0,
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

  const activeIndex = navItems.findIndex((item) => location.pathname.startsWith(item.to));

  useEffect(() => {
    const updateIndicator = () => {
      if (activeIndex !== -1 && itemRefs.current[activeIndex] && navRef.current) {
        const activeEl = itemRefs.current[activeIndex];
        const navEl = navRef.current;
        if (activeEl && navEl) {
          const navRect = navEl.getBoundingClientRect();
          const activeRect = activeEl.getBoundingClientRect();
          setIndicatorStyle({
            top: activeRect.top - navRect.top,
            height: activeRect.height,
            opacity: 1,
          });
        }
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();

    let resizeObserver: ResizeObserver | null = null;
    if (navRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateIndicator();
      });
      resizeObserver.observe(navRef.current);
      if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
        resizeObserver.observe(itemRefs.current[activeIndex]!);
      }
    }

    const frameId = requestAnimationFrame(updateIndicator);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
    };
  }, [activeIndex, isSidebarCollapsed, location.pathname]);

  const avatarUrl = user?.avatar_url ? `${import.meta.env.VITE_API_URL}${user.avatar_url}` : undefined;

  return (
    <div className="flex h-screen bg-slate-50/60 font-sans text-slate-900 antialiased overflow-hidden selection:bg-slate-900 selection:text-white">
      <NotificationProvider />

      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 z-50 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="bg-slate-900 text-white p-1.5 rounded-lg shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-base text-slate-900">Memozy Console</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Minimalist Light Architecture) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        md:relative md:translate-x-0 pt-16 md:pt-0 flex flex-col justify-between
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'w-20 overflow-visible' : 'w-64'}
      `}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo / Header Area */}
          <div className={`hidden md:flex h-16 items-center border-b border-slate-100/80 relative ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-slate-900 text-white p-2 rounded-xl shadow-xs flex-shrink-0 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-32 opacity-100'}`}>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-base text-slate-900 whitespace-nowrap">
                    Console
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-1.5 rounded-lg bg-white border border-slate-200/70 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all z-50 ${
                isSidebarCollapsed 
                  ? 'absolute -right-3 top-1/2 -translate-y-1/2 shadow-xs' 
                  : 'relative'
              }`}
              title={isSidebarCollapsed ? t('layout.admin.tooltips.expand', 'Mở rộng') : t('layout.admin.tooltips.collapse', 'Thu gọn')}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Admin User Info Strip */}
          <div className={`py-4 ${isSidebarCollapsed ? 'px-2 overflow-visible' : 'px-4'}`}>
            <div className={`bg-slate-50/80 hover:bg-slate-100/80 rounded-xl p-2.5 border border-slate-200/60 flex items-center transition-colors ${isSidebarCollapsed ? 'justify-center overflow-visible' : 'gap-3'}`}>
              <Tooltip content={isSidebarCollapsed ? (user?.full_name || user?.email) : undefined} position="right" className={isSidebarCollapsed ? 'w-full flex justify-center' : ''}>
                <Avatar size="sm" className="ring-1 ring-slate-300">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={user?.full_name || user?.email} />}
                  <AvatarFallback name={user?.full_name || user?.email} />
                </Avatar>
              </Tooltip>
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-center ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 min-w-0 opacity-100'}`}>
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  SYS_ADMIN
                </p>
                <p className="font-semibold text-slate-900 truncate text-xs whitespace-nowrap">{user?.full_name || user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className={`flex-1 px-3 ${isSidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'}`}>
            <nav ref={navRef} className="relative space-y-1 flex flex-col w-full">
              {/* Sliding Active Background Pill */}
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 rounded-xl bg-slate-900 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-0 shadow-xs"
                style={{
                  transform: `translateY(${indicatorStyle.top}px)`,
                  height: `${indicatorStyle.height}px`,
                  opacity: indicatorStyle.opacity,
                  top: 0,
                }}
              />

              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeIndex === idx;
                return (
                  <Tooltip key={item.to} content={isSidebarCollapsed ? item.label : undefined} position="right" className="w-full flex">
                    <NavLink
                      to={item.to}
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`relative z-10 flex items-center ${
                        isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
                      } text-sm font-medium rounded-xl transition-colors duration-200 group w-full ${
                        isActive
                          ? 'text-white font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${!isSidebarCollapsed ? 'mr-3' : ''} ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                      }`} />
                      <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
                        {item.label}
                      </div>
                    </NavLink>
                  </Tooltip>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Actions & Language */}
        <div className={`p-3 border-t border-slate-100 flex flex-col gap-1.5 ${isSidebarCollapsed ? 'px-2 overflow-visible' : 'px-3'}`}>
          <Tooltip content={isSidebarCollapsed ? (i18n.language === 'en' ? 'Tiếng Việt' : 'English') : undefined} position="right" className="w-full flex">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'vi' : 'en')}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors group w-full`}
            >
              <Globe className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0 ${!isSidebarCollapsed ? 'mr-2.5' : ''}`} />
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap flex items-center justify-between ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
                <span>{i18n.language === 'en' ? 'Language' : 'Ngôn ngữ'}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                  {i18n.language === 'en' ? 'EN' : 'VI'}
                </span>
              </div>
            </button>
          </Tooltip>

          <Tooltip content={isSidebarCollapsed ? 'Đăng xuất' : undefined} position="right" className="w-full flex">
            <button
              onClick={handleLogout}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition-colors group w-full`}
            >
              <LogOut className={`w-4 h-4 text-slate-400 group-hover:text-rose-500 flex-shrink-0 ${!isSidebarCollapsed ? 'mr-2.5' : ''}`} />
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap text-left ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
                {t('layout.admin.logout', 'Đăng xuất')}
              </div>
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* Main Content Area (Spacious & Clean) */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 relative bg-slate-50/40">
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


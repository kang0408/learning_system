import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Home, BookOpen, Brain, LogOut, Menu, X, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function StudentLayout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/student', icon: Home, label: 'Dashboard', end: true },
    { to: '/student/classes', icon: BookOpen, label: 'My Classes' },
    { to: '/quiz', icon: Brain, label: 'Practice' },
    { to: '/student/profile', icon: User, label: 'Profile' },
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
          <span className="font-black text-2xl tracking-tighter uppercase">SM2 <span className="text-indigo-600">Learn.</span></span>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:text-indigo-600 transition-colors"
          >
            Menu <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Fullscreen Menu Overlay - High Impact Brand Color */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-indigo-600 text-white flex flex-col animate-in fade-in duration-300">
          <div className="px-6 h-20 flex items-center justify-between border-b border-indigo-500">
            <span className="font-black text-2xl tracking-tighter uppercase">SM2 Learn.</span>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:text-indigo-200 transition-colors"
            >
              Close <X className="w-5 h-5" />
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
                <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-2">Current User</p>
                <p className="font-medium text-xl">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 font-bold uppercase tracking-widest text-sm text-indigo-200 hover:text-white transition-colors"
              >
                Logout <LogOut className="w-5 h-5" />
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

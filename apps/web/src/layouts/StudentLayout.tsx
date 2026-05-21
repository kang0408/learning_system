import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Home, BookOpen, Brain, LogOut, Menu, X } from 'lucide-react';
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
  ];

  const isImmersiveMode = location.pathname.includes('/quiz') || location.pathname.includes('/session-result');

  if (isImmersiveMode) {
    return (
      <div className="min-h-screen bg-white">
        <button 
          onClick={() => navigate('/student')}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-50 text-gray-500 hover:text-gray-900"
        >
          <X className="w-6 h-6" />
        </button>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Topbar */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="font-bold text-xl text-blue-600 tracking-tight">SM2 Learn</span>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Fullscreen Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b border-gray-100">
            <span className="font-bold text-xl text-blue-600 tracking-tight">SM2 Learn</span>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center space-y-8">
            <div className="text-center mb-8">
              <p className="text-sm text-gray-500 mb-1">Signed in as</p>
              <p className="font-medium text-lg text-gray-900">{user?.email}</p>
            </div>
            <nav className="flex flex-col space-y-4 w-full max-w-sm">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-6 py-4 text-lg font-medium rounded-2xl transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 scale-105'
                          : 'text-gray-700 hover:bg-gray-50 hover:scale-105'
                      }`
                    }
                  >
                    <Icon className="w-6 h-6 mr-4" />
                    {item.label}
                  </NavLink>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center px-6 py-4 text-lg font-medium text-gray-700 rounded-2xl hover:bg-red-50 hover:text-red-700 transition-all hover:scale-105"
              >
                <LogOut className="w-6 h-6 mr-4" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        <div className="pb-12 pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

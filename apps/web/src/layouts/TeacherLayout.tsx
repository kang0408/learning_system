import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Users, FileText, LogOut, Menu, X, GraduationCap, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function TeacherLayout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/teacher/classes', icon: Users, label: 'Lớp học', end: true },
    { to: '/teacher/questions', icon: FileText, label: 'Ngân hàng câu hỏi' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-purple-100 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-1.5 rounded-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">SM2 Learn</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-purple-50 text-purple-600 rounded-lg">
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
        fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl shadow-purple-900/5 border-r border-gray-100 transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        md:relative md:translate-x-0 pt-16 md:pt-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Area */}
        <div className="hidden md:flex h-20 items-center px-8 border-b border-gray-50 bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-xl shadow-md shadow-purple-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">SM2 Learn</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6">
          <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100/50 flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
              {user?.email?.charAt(0).toUpperCase() || 'T'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Teacher
              </p>
              <p className="font-semibold text-gray-900 truncate text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Menu Quản Lý</p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 group ${isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200 translate-x-1'
                      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'}`} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-50 bg-gray-50/30">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-4 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 w-full transition-all shadow-sm group"
          >
            <LogOut className="w-5 h-5 mr-2 text-gray-400 group-hover:text-red-500 transition-colors" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-50 to-transparent -z-10 pointer-events-none" />
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

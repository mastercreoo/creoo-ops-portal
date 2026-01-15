
import React, { useState } from 'react';
import { Menu, X, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { NAVIGATION, APP_NAME } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Role } from '../types';
import { activeAdapter } from '../services/dataAdapter';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const filteredNav = NAVIGATION.filter(item => item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm font-black">C</span>
              {APP_NAME}
            </h1>
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
            {filteredNav.map((item) => {
              // Role-based label overrides
              let label = item.name;
              if (item.path === '/requests' && (user.role === Role.Employee || user.role === Role.Intern)) {
                label = 'My Requests';
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${location.pathname === item.path 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                  `}
                >
                  <item.icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between lg:px-8 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 lg:hidden hover:bg-slate-100 rounded-md"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            {activeAdapter.isMock && (
              <span className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
                <ShieldAlert size={14} />
                Demo Mode Active
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

import React from 'react';
import { LayoutDashboard, UploadCloud, User, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, isSidebarCollapsed, toggleSidebar } = useData();
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as const, label: 'Upload Excel', icon: UploadCloud },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  const initialLetter = (user?.displayName || user?.email || 'A').charAt(0).toUpperCase();

  return (
    <aside
      className={`sticky top-4 self-start h-[calc(100vh-2rem)] flex flex-col justify-between glass-panel rounded-3xl p-4 border border-white/70 shadow-xl z-30 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="space-y-6">
        {/* Logo Header: Switches between agivant-logo.png and agivant-favicon.jpg when collapsed */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className={`flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
            {isSidebarCollapsed ? (
              <img 
                src="/agivant-favicon.jpg" 
                alt="Agivant Favicon" 
                className="w-9 h-9 rounded-xl object-cover shadow-md border border-white/80 transition-all duration-300"
              />
            ) : (
              <img 
                src="/agivant-logo.png" 
                alt="Agivant Logo" 
                className="h-10 max-w-[170px] object-contain transition-all duration-300"
              />
            )}
          </div>

          {!isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-xl hover:bg-white/60 text-slate-400 hover:text-slate-700 transition"
              title="Minimize sidebar to icons"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3.5 py-3'
                } rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout Button */}
      <div className="space-y-3 pt-4 border-t border-slate-200/50">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
              {initialLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.displayName || user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={isSidebarCollapsed ? "Logout" : undefined}
          className={`w-full flex items-center ${
            isSidebarCollapsed ? 'justify-center py-3' : 'justify-center gap-2 px-3.5 py-2.5'
          } rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50/80 transition border border-rose-200/40 cursor-pointer`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isSidebarCollapsed && <span>Logout</span>}
        </button>

        {isSidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

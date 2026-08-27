import React from 'react';
import { LayoutDashboard, UploadCloud, Trash2, PanelLeftClose, PanelLeftOpen, Database } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, isSidebarCollapsed, toggleSidebar, records, clearData } = useData();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as const, label: 'Upload Excel', icon: UploadCloud },
  ];

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear local demand records? You can re-upload an Excel file anytime.")) {
      clearData();
    }
  };

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

      {/* Local Storage & Controls */}
      <div className="space-y-3 pt-4 border-t border-slate-200/50">
        {!isSidebarCollapsed && (
          <div className="p-3 rounded-2xl bg-white/40 border border-white/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                Local Storage
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">
                {records.length} records
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              All parsed data is stored directly in your browser.
            </p>
          </div>
        )}

        {records.length > 0 && (
          <button
            onClick={handleClearData}
            title={isSidebarCollapsed ? "Clear Local Data" : undefined}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center py-3' : 'justify-center gap-2 px-3.5 py-2.5'
            } rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50/80 transition border border-rose-200/40`}
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            {!isSidebarCollapsed && <span>Clear Local Data</span>}
          </button>
        )}

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

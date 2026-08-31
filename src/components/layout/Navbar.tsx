import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { activeTab } = useData();
  const { user } = useAuth();

  const titleMap = {
    dashboard: 'Demand Dashboard',
    upload: 'Upload Excel Spreadsheet',
    profile: 'User Profile & Preferences'
  };

  const initialLetter = (user?.displayName || user?.email || 'A').charAt(0).toUpperCase();

  return (
    <header className="h-16 flex items-center justify-between px-2 mb-6">
      {/* Dynamic Section Title */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {titleMap[activeTab]}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Agivant Demand Analytics
          </p>
        </div>
      </div>

      {/* Right User Profile Initial Pill */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full glass-panel border border-white/80 shadow-sm">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {initialLetter}
          </div>
          <span className="text-xs font-semibold text-slate-700">
            {user?.displayName || user?.email?.split('@')[0] || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
};

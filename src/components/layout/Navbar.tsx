import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Database } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, records } = useData();

  const titleMap = {
    dashboard: 'Demand Dashboard',
    upload: 'Upload Excel Spreadsheet'
  };

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

      {/* Right Local Mode Status Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-white/80 shadow-sm text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>Local Storage Mode</span>
          <span className="text-[10px] text-slate-400 border-l border-slate-200 pl-2">
            {records.length} records
          </span>
        </div>
      </div>
    </header>
  );
};

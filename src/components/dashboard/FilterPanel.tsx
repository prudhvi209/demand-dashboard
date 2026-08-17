import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, ChevronDown, RotateCcw } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export const FilterPanel: React.FC = () => {
  const { filters, setFilter, resetFilters, records } = useData();

  if (!records || records.length === 0) {
    return null;
  }

  // Extract unique sorted options dynamically from the dataset
  const departments = useMemo(() => {
    return Array.from(new Set(records.map(r => r.department?.trim()).filter(Boolean) as string[])).sort();
  }, [records]);

  const clients = useMemo(() => {
    return Array.from(new Set(records.map(r => r.client?.trim()).filter(Boolean) as string[])).sort();
  }, [records]);

  const statuses = useMemo(() => {
    return Array.from(new Set(records.map(r => r.status?.trim()).filter(Boolean) as string[])).sort();
  }, [records]);

  const eds = useMemo(() => {
    return Array.from(new Set(records.map(r => r.dealOwner?.trim()).filter(Boolean) as string[])).sort();
  }, [records]);

  const locations = useMemo(() => {
    return Array.from(new Set(records.map(r => r.location?.trim()).filter(Boolean) as string[])).sort();
  }, [records]);

  const isFiltered = Boolean(
    (filters.department && filters.department !== 'all') ||
    (filters.client && filters.client !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.ed && filters.ed !== 'all') ||
    (filters.location && filters.location !== 'all')
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 md:p-5 border border-white/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3.5">
        <Filter className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Dashboard Filters (Slicers)
        </h3>
        {isFiltered && (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full ml-auto">
            Filtered
          </span>
        )}
      </div>

      {/* Slicers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-3 items-end">
        {/* Department Slicer */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
            Department
          </label>
          <div className="relative">
            <select
              value={filters.department || 'all'}
              onChange={(e) => setFilter('department', e.target.value === 'all' ? null : e.target.value)}
              className="w-full appearance-none bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Client Slicer */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
            Client
          </label>
          <div className="relative">
            <select
              value={filters.client || 'all'}
              onChange={(e) => setFilter('client', e.target.value === 'all' ? null : e.target.value)}
              className="w-full appearance-none bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all cursor-pointer"
            >
              <option value="all">All Clients</option>
              {clients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Position Status Slicer */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
            Position Status
          </label>
          <div className="relative">
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilter('status', e.target.value === 'all' ? null : e.target.value)}
              className="w-full appearance-none bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ED Slicer */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
            ED
          </label>
          <div className="relative">
            <select
              value={filters.ed || 'all'}
              onChange={(e) => setFilter('ed', e.target.value === 'all' ? null : e.target.value)}
              className="w-full appearance-none bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all cursor-pointer"
            >
              <option value="all">All EDs</option>
              {eds.map((ed) => (
                <option key={ed} value={ed}>
                  {ed}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Location Slicer */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
            Location
          </label>
          <div className="relative">
            <select
              value={filters.location || 'all'}
              onChange={(e) => setFilter('location', e.target.value === 'all' ? null : e.target.value)}
              className="w-full appearance-none bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all cursor-pointer"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Reset Slicers Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={resetFilters}
            className={`p-2.5 rounded-xl border transition-all shadow-2xs flex items-center justify-center h-[38px] w-[38px] flex-shrink-0 ${
              isFiltered
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border-slate-200'
            }`}
            title="Reset all filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, Layers } from 'lucide-react';
import { DemandRecord } from '../../types';

interface ChartDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  records: DemandRecord[];
}

export const formatWeekToIsoDate = (weekStr?: string): string => {
  if (!weekStr) return '-';
  const str = weekStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const parts = str.split('-');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const monthStr = parts[1].toLowerCase();
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const month = months[monthStr.slice(0, 3)] || '01';
    let year = parts[2];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  return str;
};

const getStatusBadgeClass = (status?: string) => {
  const s = (status || '').toLowerCase().trim();
  if (s.includes('drop')) {
    return 'bg-rose-50 text-rose-600 border border-rose-200/80';
  }
  if (s.includes('open') || s.includes('active')) {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
  }
  if (s.includes('ident') || s.includes('offer')) {
    return 'bg-sky-50 text-sky-700 border border-sky-200/80';
  }
  if (s.includes('hold')) {
    return 'bg-purple-50 text-purple-700 border border-purple-200/80';
  }
  if (s.includes('fill') || s.includes('fulfill') || s.includes('close')) {
    return 'bg-teal-50 text-teal-700 border border-teal-200/80';
  }
  return 'bg-slate-100 text-slate-700 border border-slate-200';
};

export const ChartDetailsModal: React.FC<ChartDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  records
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Reset search when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Handle ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase().trim();
    return records.filter((r) => 
      (r.client && r.client.toLowerCase().includes(term)) ||
      (r.position && r.position.toLowerCase().includes(term)) ||
      (r.status && r.status.toLowerCase().includes(term)) ||
      (r.dealOwner && r.dealOwner.toLowerCase().includes(term)) ||
      (r.internalExternal && r.internalExternal.toLowerCase().includes(term)) ||
      (r.location && r.location.toLowerCase().includes(term)) ||
      (r.department && r.department.toLowerCase().includes(term))
    );
  }, [records, searchTerm]);

  const totalPositionsCount = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + (curr.requiredCount || 1), 0);
  }, [filtered]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-5xl w-full max-h-[88vh] flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{title}</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {subtitle || `${records.length} records found for this selection.`}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Search filter if more than 3 records */}
              {records.length > 3 && (
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search client, role, ED..."
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200 shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto">
            {filtered.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 backdrop-blur-md z-10">
                    <th className="py-3 px-5 whitespace-nowrap">Week</th>
                    <th className="py-3 px-5 whitespace-nowrap">Client</th>
                    <th className="py-3 px-5 whitespace-nowrap">Role</th>
                    <th className="py-3 px-5 whitespace-nowrap">Emp Name</th>
                    <th className="py-3 px-5 whitespace-nowrap">Status</th>
                    <th className="py-3 px-5 whitespace-nowrap">Type</th>
                    <th className="py-3 px-5 whitespace-nowrap">Positions</th>
                    <th className="py-3 px-5 whitespace-nowrap">Owner/ED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 text-xs">
                  {filtered.map((record, index) => {
                    const statusClass = getStatusBadgeClass(record.status);
                    const formattedWeek = formatWeekToIsoDate(record.week);
                    const roleName = record.position || 'Engineer';
                    const clientName = record.client || 'Delivery';
                    const empName = record.employeeName || '-';
                    const dealOwner = record.dealOwner || '-';
                    const type = record.internalExternal || (record.status?.toLowerCase().includes('bench') ? 'Internal' : 'External');
                    const positions = record.requiredCount || 1;

                    return (
                      <tr
                        key={record.id || `row-${index}`}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-medium text-slate-600 whitespace-nowrap">
                          {formattedWeek}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-900 whitespace-nowrap">
                          {clientName}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-blue-600 whitespace-nowrap hover:underline cursor-default">
                          {roleName}
                        </td>
                        <td className="py-3.5 px-5 font-medium text-slate-500 whitespace-nowrap">
                          {empName}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusClass}`}>
                            {record.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-medium text-slate-600 whitespace-nowrap">
                          {type}
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-slate-900 whitespace-nowrap">
                          {positions}
                        </td>
                        <td className="py-3.5 px-5 font-medium text-slate-600 whitespace-nowrap">
                          {dealOwner}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-14 px-6 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Filter className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No matching records found</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  {searchTerm ? `No records match "${searchTerm}". Try another search term.` : 'No detailed records found for this chart selection.'}
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Showing <strong className="text-slate-800 font-bold">{filtered.length}</strong> {filtered.length === 1 ? 'record' : 'records'}
                {totalPositionsCount !== filtered.length && (
                  <span> (<strong className="text-slate-800 font-bold">{totalPositionsCount}</strong> total positions)</span>
                )}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

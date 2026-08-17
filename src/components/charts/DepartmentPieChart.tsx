import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { cardRevealVariants } from '../../lib/animations';
import { DepartmentDistributionData, DemandRecord } from '../../types';
import { FileSpreadsheet, X } from 'lucide-react';

interface DepartmentPieChartProps {
  data?: DepartmentDistributionData[];
  rawRecords?: DemandRecord[];
  /** Latest snapshot week label, e.g. "29-Jul-2026" */
  snapshotWeek?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel p-2.5 rounded-xl shadow-lg border border-white/80 text-xs font-sans">
        <div className="flex items-center gap-1.5 font-bold" style={{ color: data.color }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.color }} />
          <span>{data.name}</span>
        </div>
        <p className="mt-1 text-slate-800 font-bold">
          {data.value} positions
        </p>
      </div>
    );
  }
  return null;
};

export const DepartmentPieChart: React.FC<DepartmentPieChartProps> = ({ data = [], rawRecords = [], snapshotWeek }) => {
  const hasData = data && data.length > 0;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group roles and calculate breakdowns per client for the modal
  const clientBreakdown = useMemo(() => {
    if (!rawRecords || rawRecords.length === 0) return [];
    
    const clientMap: Record<string, { total: number; roles: Record<string, number> }> = {};
    
    rawRecords.forEach((r) => {
      const clientName = (r.client || 'Delivery').trim();
      const roleName = (r.position || 'Unknown Role').trim();
      const count = r.requiredCount || 1;
      
      if (!clientMap[clientName]) {
        clientMap[clientName] = { total: 0, roles: {} };
      }
      
      clientMap[clientName].total += count;
      clientMap[clientName].roles[roleName] = (clientMap[clientName].roles[roleName] || 0) + count;
    });
    
    return Object.entries(clientMap)
      .map(([name, details]) => ({
        name,
        total: details.total,
        roles: Object.entries(details.roles)
          .map(([roleName, count]) => ({ roleName, count }))
          .sort((a, b) => b.count - a.count)
      }))
      .sort((a, b) => b.total - a.total);
  }, [rawRecords]);

  return (
    <>
      <motion.div 
        variants={cardRevealVariants}
        initial="initial"
        animate="animate"
        className="glass-card rounded-2xl p-5 md:p-6 border border-white/60 flex flex-col justify-between h-full"
      >
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Client Distribution</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Share of position demand across top client accounts{snapshotWeek ? ` · ${snapshotWeek}` : ''}
          </p>
        </div>

        <div className="h-full mt-2 flex flex-col justify-center">
          {hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 w-full">
              <div className="h-48 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">{total.toFixed(total % 1 !== 0 ? 2 : 0).replace(/\.?0+$/, '')}</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mt-1">POSITIONS</span>
                </div>
              </div>

              <div className="flex flex-col justify-between h-full py-1">
                <div className="space-y-2">
                  {data.map((item) => (
                    <div 
                      key={item.name} 
                      className="px-3 py-1.5 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md flex items-center justify-between shadow-2xs text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-700 flex-shrink-0">{item.value} pos</span>
                    </div>
                  ))}
                </div>
                
                {clientBreakdown.length > 0 && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full mt-3 py-2 px-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-600 font-semibold text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    View More Details
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2 py-8 h-64 flex flex-col items-center justify-center">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center border border-blue-100">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-500 font-medium max-w-xs">
                No client demand records available for this reporting period.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            {/* Backdrop close area */}
            <div className="absolute inset-0 cursor-default" onClick={() => setIsModalOpen(false)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Client Role Breakdown</h4>
                  <p className="text-[11px] text-slate-500 font-medium">All active position roles mapped by client account</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {clientBreakdown.map((client) => (
                  <div key={client.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                    {/* Client Header */}
                    <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                      <span className="font-bold text-slate-900 text-sm">{client.name}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                        {client.total} {client.total === 1 ? 'position' : 'positions'}
                      </span>
                    </div>
                    {/* Roles list */}
                    <div className="space-y-1.5 pt-1">
                      {client.roles.map((role) => (
                        <div key={role.roleName} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">{role.roleName}</span>
                          <span className="text-slate-400 font-bold">{role.count} {role.count === 1 ? 'role' : 'roles'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

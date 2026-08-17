import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { cardRevealVariants } from '../../lib/animations';
import { DepartmentDistributionData } from '../../types';
import { FileSpreadsheet } from 'lucide-react';

interface DepartmentPieChartProps {
  data?: DepartmentDistributionData[];
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

export const DepartmentPieChart: React.FC<DepartmentPieChartProps> = ({ data = [], snapshotWeek }) => {
  const hasData = data && data.length > 0;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div 
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      className="glass-card rounded-2xl p-5 md:p-6 border border-white/60 flex flex-col justify-between"
    >
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Client Distribution</h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Share of position demand across top client accounts{snapshotWeek ? ` · ${snapshotWeek}` : ''}
        </p>
      </div>

      <div className="h-64 w-full mt-2 flex items-center justify-center">
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
          </div>
        ) : (
          <div className="text-center space-y-2 py-8">
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
  );
};

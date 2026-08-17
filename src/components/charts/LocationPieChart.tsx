import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { cardRevealVariants } from '../../lib/animations';
import { FileSpreadsheet } from 'lucide-react';

interface LocationPieChartProps {
  data?: { name: string; value: number; percentage: number; color: string }[];
  snapshotWeek?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel p-2.5 rounded-xl shadow-lg border border-white/80 text-xs">
        <div className="flex items-center gap-1.5 font-bold" style={{ color: data.color }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.color }} />
          <span>{data.name} Location</span>
        </div>
        <p className="mt-1 text-slate-800 font-bold">
          {data.value} positions ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export const LocationPieChart: React.FC<LocationPieChartProps> = ({ data = [], snapshotWeek }) => {
  const hasData = data && data.length > 0;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div 
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      className="glass-card rounded-2xl p-5 md:p-6 border border-white/60 flex flex-col justify-between h-full min-h-[320px]"
    >
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Demand by Location</h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Active demand split by location{snapshotWeek ? ` · ${snapshotWeek}` : ''}
        </p>
      </div>

      <div className="w-full flex-1 flex flex-col items-center justify-center my-2">
        {hasData ? (
          <div className="w-full flex flex-col items-center justify-between gap-3">
            {/* Donut Pie Container */}
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={4}
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

            {/* Legend Pills Grid */}
            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              {data.map((item) => (
                <div 
                  key={item.name} 
                  className="p-2.5 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md flex flex-col justify-between shadow-2xs gap-1"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-[11px] font-semibold text-slate-500">{item.value} pos</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[11px] font-extrabold text-white" style={{ backgroundColor: item.color }}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2 py-8">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-500 mx-auto flex items-center justify-center border border-cyan-100">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xs">
              No location data available for this reporting period.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { cardRevealVariants } from '../../lib/animations';
import { DemandTrendData } from '../../types';
import { FileSpreadsheet, Calendar, ChevronDown } from 'lucide-react';

interface DemandTrendChartProps {
  data?: DemandTrendData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl shadow-lg border border-white/80 text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label} Pipeline</p>
        <div className="flex items-center gap-2 text-blue-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
          <span>Active Demand: {payload[0].value} positions</span>
        </div>
        {payload[1] && (
          <div className="flex items-center gap-2 text-emerald-600 font-medium mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Fulfilled: {payload[1].value} positions</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const DemandTrendChart: React.FC<DemandTrendChartProps> = ({ data = [] }) => {
  const [filterRange, setFilterRange] = useState<string>('all');

  const displayData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (filterRange === 'last3') return data.slice(-3);
    if (filterRange === 'last6') return data.slice(-6);
    return data;
  }, [data, filterRange]);

  const hasData = displayData && displayData.length > 0;

  return (
    <motion.div 
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      className="glass-card rounded-2xl p-6 border border-white/60 flex flex-col justify-between"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">Demand Trend</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Monthly trajectory of active talent requests</p>
        </div>

        <div className="flex items-center gap-3">
          {hasData && (
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600">Active Demand</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Fulfilled</span>
              </div>
            </div>
          )}

          {data.length > 3 && (
            <div className="relative inline-flex items-center">
              <Calendar className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
              <select
                value={filterRange}
                onChange={(e) => setFilterRange(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-6 pr-6 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="all">All Months</option>
                <option value="last3">Last 3 Months</option>
                <option value="last6">Last 6 Months</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      <div className="h-64 w-full flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="fulfilledGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                dy={8}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="demand" 
                stroke="#2563eb" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#demandGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="fulfilled" 
                stroke="#10b981" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                fillOpacity={1} 
                fill="url(#fulfilledGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center space-y-2 py-8">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center border border-blue-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xs">
              No demand data uploaded yet. Upload an Excel spreadsheet to visualize demand trends.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

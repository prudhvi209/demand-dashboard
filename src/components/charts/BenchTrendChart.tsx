import React from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { cardRevealVariants } from '../../lib/animations';
import { BenchTrendData } from '../../types';
import { FileSpreadsheet } from 'lucide-react';

interface BenchTrendChartProps {
  data?: BenchTrendData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl shadow-lg border border-white/80 text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label} Resource Allocation</p>
        <div className="flex items-center gap-2 text-rose-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          <span>Internal Talent: {payload[0].value}</span>
        </div>
        {payload[1] && (
          <div className="flex items-center gap-2 text-sky-600 font-medium mt-0.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
            <span>External Requisitions: {payload[1].value}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const BenchTrendChart: React.FC<BenchTrendChartProps> = ({ data = [] }) => {
  const hasData = data && data.length > 0;

  return (
    <motion.div 
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      className="glass-card rounded-2xl p-6 border border-white/60 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">Resource Allocation Trend</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Internal bench talent vs external requisitions</p>
        </div>
        {hasData && (
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600">Internal Talent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="text-slate-600">External</span>
            </div>
          </div>
        )}
      </div>

      <div className="h-64 w-full flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <Line 
                type="monotone" 
                dataKey="bench" 
                stroke="#ef4444" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="deployed" 
                stroke="#0ea5e9" 
                strokeWidth={2.5} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center space-y-2 py-8">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center border border-rose-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xs">
              No bench data uploaded yet. Upload an Excel file to track resource allocation.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

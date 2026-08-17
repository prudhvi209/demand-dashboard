import React from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  LabelList 
} from 'recharts';
import { cardRevealVariants } from '../../lib/animations';
import { WowTrendPoint } from '../../types';
import { FileSpreadsheet } from 'lucide-react';

interface WowDemandChartProps {
  title: string;
  subtitle: string;
  dataKey: keyof Omit<WowTrendPoint, 'week'>;
  data?: WowTrendPoint[];
  strokeColor?: string;
  gradientId: string;
}

const CustomTooltip = ({ active, payload, label, title }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-2.5 rounded-xl shadow-lg border border-white/80 text-xs font-sans">
        <p className="font-semibold text-slate-500 mb-0.5">{label}</p>
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: payload[0].stroke }} />
          <span>{title}: {payload[0].value} positions</span>
        </div>
      </div>
    );
  }
  return null;
};

// Subtle custom label renderer for line points
const SubtleValueLabel = (props: any) => {
  const { x, y, value } = props;
  if (x === undefined || y === undefined || value === undefined) return null;

  return (
    <text 
      x={x} 
      y={y - 8} 
      textAnchor="middle" 
      fill="#475569" 
      fontSize={10} 
      fontWeight={600} 
      fontFamily="sans-serif"
    >
      {value}
    </text>
  );
};

export const WowDemandChart: React.FC<WowDemandChartProps> = ({
  title,
  subtitle,
  dataKey,
  data = [],
  strokeColor = '#0284c7',
  gradientId
}) => {
  const hasData = data && data.length > 0;

  return (
    <motion.div 
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      className="glass-card rounded-2xl p-5 md:p-6 border border-white/60 flex flex-col justify-between"
    >
      <div className="mb-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
      </div>

      <div className="h-52 w-full flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 18, right: 15, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.8} />
              <XAxis 
                dataKey="week" 
                axisLine={true} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                stroke="#cbd5e1"
                dy={4}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
              />
              <Tooltip content={<CustomTooltip title={title} />} />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={strokeColor} 
                strokeWidth={2.5} 
                dot={{ r: 4, fill: strokeColor, stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: strokeColor }}
              >
                <LabelList dataKey={dataKey} content={<SubtleValueLabel />} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center space-y-2 py-8">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center border border-blue-100">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xs">
              No data available for this reporting period.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

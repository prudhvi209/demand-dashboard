import React, { useState, useMemo } from 'react';
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
import { DateFilterPreset, filterWowTrendsByDatePreset } from '../../utils/dateFilterUtils';
import { DatePresetFilter } from '../common/DatePresetFilter';

interface WowDemandChartProps {
  title: string;
  subtitle: string;
  dataKey: keyof Omit<WowTrendPoint, 'week'>;
  data?: WowTrendPoint[];
  strokeColor?: string;
  gradientId: string;
  onPointClick?: (point: WowTrendPoint, title: string, dataKey: keyof Omit<WowTrendPoint, 'week'>) => void;
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
        <p className="text-[10px] text-blue-600 font-semibold mt-1">Click point to view records</p>
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

// Custom tick: rotates label and shortens "30-Jun-26" → "30 Jun"
const CustomXAxisTick = ({ x, y, payload }: any) => {
  if (!payload?.value) return null;
  const parts = String(payload.value).split('-');
  const short = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : payload.value;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        transform="rotate(-35)"
        fill="#64748b"
        fontSize={10}
        fontWeight={500}
        fontFamily="sans-serif"
      >
        {short}
      </text>
    </g>
  );
};

export const WowDemandChart: React.FC<WowDemandChartProps> = ({
  title,
  subtitle,
  dataKey,
  data = [],
  strokeColor = '#0284c7',
  gradientId,
  onPointClick
}) => {
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const weeks = useMemo(() => data.map(d => d.week), [data]);

  const displayData = useMemo(() => {
    return filterWowTrendsByDatePreset(data, datePreset, customStart, customEnd);
  }, [data, datePreset, customStart, customEnd]);

  const hasData = displayData && displayData.length > 0;

  const handleChartClick = (e: any) => {
    if (onPointClick && e && e.activePayload && e.activePayload.length) {
      const point = e.activePayload[0].payload as WowTrendPoint;
      onPointClick(point, title, dataKey);
    }
  };

  return (
    <motion.div 
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      className="glass-card rounded-2xl p-5 md:p-6 border border-white/60 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between gap-2 mb-3 pb-1 border-b border-slate-100/60">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Date Filter Dropdown for this Chart */}
        {data.length > 1 && (
          <DatePresetFilter
            weeks={weeks}
            preset={datePreset}
            customStart={customStart}
            customEnd={customEnd}
            onPresetChange={setDatePreset}
            onCustomChange={(start, end) => {
              setCustomStart(start);
              setCustomEnd(end);
            }}
            compact={true}
          />
        )}
      </div>

      <div className="h-60 w-full flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={displayData} 
              margin={{ top: 18, right: 15, left: -22, bottom: 30 }}
              onClick={handleChartClick}
              className="cursor-pointer"
            >
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
                stroke="#cbd5e1"
                interval={0}
                tick={<CustomXAxisTick />}
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
                dot={{ 
                  r: 4.5, 
                  fill: strokeColor, 
                  stroke: '#ffffff', 
                  strokeWidth: 2, 
                  cursor: 'pointer' 
                }}
                activeDot={{ 
                  r: 6.5, 
                  fill: strokeColor, 
                  stroke: '#ffffff', 
                  strokeWidth: 2, 
                  cursor: 'pointer',
                  onClick: (_: any, payload: any) => {
                    if (onPointClick && payload && payload.payload) {
                      onPointClick(payload.payload, title, dataKey);
                    }
                  }
                }}
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

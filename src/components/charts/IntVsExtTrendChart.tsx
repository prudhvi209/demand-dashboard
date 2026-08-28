import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { cardRevealVariants } from '../../lib/animations';
import { IntVsExtTrendPoint } from '../../types';
import { FileSpreadsheet } from 'lucide-react';
import { DateFilterPreset, filterWowTrendsByDatePreset } from '../../utils/dateFilterUtils';
import { DatePresetFilter } from '../common/DatePresetFilter';

interface IntVsExtTrendChartProps {
  data?: IntVsExtTrendPoint[];
  /** Called when user clicks a data point. weekLabel = e.g. "28-Jul-26", type = which series was clicked */
  onPointClick?: (weekLabel: string, type: 'internal' | 'external') => void;
}

const INTERNAL_COLOR = '#f97316'; // orange-500
const EXTERNAL_COLOR = '#0284c7'; // sky-600

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const internal = payload.find((p: any) => p.dataKey === 'internal');
    const external = payload.find((p: any) => p.dataKey === 'external');
    const total = (internal?.value ?? 0) + (external?.value ?? 0);
    const intPct = total > 0 ? Math.round(((internal?.value ?? 0) / total) * 100) : 0;
    const extPct = total > 0 ? 100 - intPct : 0;

    return (
      <div className="glass-panel p-3 rounded-xl shadow-lg border border-white/80 text-xs font-sans min-w-[160px]">
        <p className="font-semibold text-slate-500 mb-2">{label}</p>
        {internal && (
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-1.5 text-orange-600 font-medium">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: INTERNAL_COLOR }} />
              <span>Internal</span>
            </div>
            <span className="font-bold text-slate-800">
              {internal.value} pos{' '}
              <span className="text-[10px] font-semibold text-orange-500">({intPct}%)</span>
            </span>
          </div>
        )}
        {external && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-sky-600 font-medium">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: EXTERNAL_COLOR }} />
              <span>External</span>
            </div>
            <span className="font-bold text-slate-800">
              {external.value} pos{' '}
              <span className="text-[10px] font-semibold text-sky-500">({extPct}%)</span>
            </span>
          </div>
        )}
        {total > 0 && (
          <div className="border-t border-slate-100 mt-2 pt-1.5 text-slate-500 flex justify-between">
            <span>Total</span>
            <span className="font-bold text-slate-700">{total} pos</span>
          </div>
        )}
        <p className="text-[10px] text-blue-600 font-semibold mt-1.5">Click point to view records</p>
      </div>
    );
  }
  return null;
};

// Reuse filterWowTrendsByDatePreset — it only cares about the 'week' key
const adaptForFilter = (data: IntVsExtTrendPoint[]) =>
  data as unknown as Parameters<typeof filterWowTrendsByDatePreset>[0];

// Custom tick: rotates label and shortens "30-Jun-26" → "30 Jun"
const CustomXAxisTick = ({ x, y, payload }: any) => {
  if (!payload?.value) return null;
  // Shorten: "30-Jun-26" → "30 Jun"
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

export const IntVsExtTrendChart: React.FC<IntVsExtTrendChartProps> = ({ data = [], onPointClick }) => {
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const weeks = useMemo(() => data.map((d) => d.week), [data]);

  const displayData = useMemo(() => {
    return filterWowTrendsByDatePreset(
      adaptForFilter(data),
      datePreset,
      customStart,
      customEnd
    ) as unknown as IntVsExtTrendPoint[];
  }, [data, datePreset, customStart, customEnd]);

  const hasData = displayData && displayData.length > 0;

  return (
    <motion.div
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      className="glass-card rounded-2xl p-5 md:p-6 border border-white/60 flex flex-col justify-between"
    >
      {/* Header */}
      <div className="mb-3 pb-2 border-b border-slate-100/60 space-y-2">
        {/* Row 1: title + subtitle */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Internal vs External Trend
          </h3>
          
        </div>

        {/* Row 2: legend + date filter */}
        <div className="flex items-center justify-between gap-2">
          {/* Legend pills */}
          {hasData && (
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: INTERNAL_COLOR }} />
                <span className="text-slate-600">Internal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: EXTERNAL_COLOR }} />
                <span className="text-slate-600">External</span>
              </div>
            </div>
          )}
          {!hasData && <div />}

          {/* Date filter */}
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
      </div>


      {/* Chart body — extra bottom room for angled labels */}
      <div className="h-60 w-full flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={displayData}
              margin={{ top: 12, right: 12, left: -22, bottom: 30 }}
              className="cursor-pointer"
            >
              <defs>
                <linearGradient id="intGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={INTERNAL_COLOR} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={INTERNAL_COLOR} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="extGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={EXTERNAL_COLOR} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={EXTERNAL_COLOR} stopOpacity={0.0} />
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

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="internal"
                stroke={INTERNAL_COLOR}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#intGradient)"
                dot={{ r: 4, fill: INTERNAL_COLOR, stroke: '#ffffff', strokeWidth: 2, cursor: 'pointer' }}
                activeDot={{
                  r: 6,
                  fill: INTERNAL_COLOR,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  cursor: 'pointer',
                  onClick: (_: any, payload: any) => {
                    if (onPointClick && payload?.payload?.week) {
                      onPointClick(payload.payload.week, 'internal');
                    }
                  }
                }}
              />
              <Area
                type="monotone"
                dataKey="external"
                stroke={EXTERNAL_COLOR}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#extGradient)"
                dot={{ r: 4, fill: EXTERNAL_COLOR, stroke: '#ffffff', strokeWidth: 2, cursor: 'pointer' }}
                activeDot={{
                  r: 6,
                  fill: EXTERNAL_COLOR,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  cursor: 'pointer',
                  onClick: (_: any, payload: any) => {
                    if (onPointClick && payload?.payload?.week) {
                      onPointClick(payload.payload.week, 'external');
                    }
                  }
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center space-y-2 py-8">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center border border-orange-100">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xs">
              No internal/external data available for this reporting period.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

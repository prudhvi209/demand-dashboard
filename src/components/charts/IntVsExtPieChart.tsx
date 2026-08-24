import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { cardRevealVariants } from '../../lib/animations';
import { IntVsExtDistributionData, DemandRecord } from '../../types';
import { FileSpreadsheet } from 'lucide-react';
import { aggregateIntVsExtDistribution } from '../../utils/excelParser';
import { DateFilterPreset, filterRecordsByDatePreset, analyzeDatePresets } from '../../utils/dateFilterUtils';
import { DatePresetFilter } from '../common/DatePresetFilter';

interface IntVsExtPieChartProps {
  data?: IntVsExtDistributionData[];
  rawRecords?: DemandRecord[];
  /** Latest snapshot week label, e.g. "29-Jul-2026" */
  snapshotWeek?: string;
  onSelectSlice?: (item: IntVsExtDistributionData) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel p-2.5 rounded-xl shadow-lg border border-white/80 text-xs">
        <div className="flex items-center gap-1.5 font-bold" style={{ color: data.color }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.color }} />
          <span>{data.name} Demand</span>
        </div>
        <p className="mt-1 text-slate-800 font-bold">
          {data.value} positions ({data.percentage}%)
        </p>
        <p className="text-[10px] text-blue-600 font-semibold mt-1">Click to view details</p>
      </div>
    );
  }
  return null;
};

export const IntVsExtPieChart: React.FC<IntVsExtPieChartProps> = ({ 
  data = [], 
  rawRecords,
  snapshotWeek, 
  onSelectSlice 
}) => {
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('current_week');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const availableWeeks = useMemo(() => {
    if (!rawRecords || rawRecords.length === 0) return [];
    return Array.from(new Set(rawRecords.map(r => r.week).filter(Boolean) as string[]));
  }, [rawRecords]);

  const chartData = useMemo(() => {
    if (!rawRecords || rawRecords.length === 0) return data;
    
    const inactive = new Set(['Dropped', 'Filled', 'Closed']);
    const activeRecords = rawRecords.filter(r => !inactive.has((r.status || '').trim()));
    const filtered = filterRecordsByDatePreset(activeRecords, datePreset, customStart, customEnd);

    return aggregateIntVsExtDistribution(filtered);
  }, [rawRecords, data, datePreset, customStart, customEnd]);

  const hasData = chartData && chartData.length > 0;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const currentPeriodLabel = useMemo(() => {
    const info = analyzeDatePresets(availableWeeks);
    if (datePreset === 'all') return 'All reporting periods combined';
    if (datePreset === 'current_week') return `Current Week · ${info.currentWeek || snapshotWeek || ''}`;
    if (datePreset === 'last_week') return `Last Week · ${info.lastWeek || ''}`;
    if (datePreset === 'this_month') return `This Month · ${info.thisMonthLabel}`;
    if (datePreset === 'last_month') return `Last Month · ${info.lastMonthLabel}`;
    if (datePreset === 'custom' && customStart && customEnd) return `Range · ${customStart} to ${customEnd}`;
    return 'Custom selection';
  }, [datePreset, availableWeeks, snapshotWeek, customStart, customEnd]);

  return (
    <motion.div 
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      className="glass-card rounded-2xl p-5 md:p-6 border border-white/60 flex flex-col justify-between h-full min-h-[320px]"
    >
      <div className="flex items-center justify-between gap-2 mb-3 pb-1 border-b border-slate-100/60">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">Internal vs External Mix</h3>
          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            {currentPeriodLabel}
          </p>
        </div>

        {/* Date Filter Dropdown */}
        {availableWeeks.length > 0 && (
          <DatePresetFilter
            weeks={availableWeeks}
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

      <div className="w-full flex-1 flex flex-col items-center justify-center my-2">
        {hasData ? (
          <div className="w-full flex flex-col items-center justify-between gap-3">
            {/* Donut Pie Container */}
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    className="cursor-pointer"
                    onClick={(entry) => onSelectSlice?.(entry)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer hover:opacity-80 transition-opacity" />
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
              {chartData.map((item) => (
                <div 
                  key={item.name} 
                  onClick={() => onSelectSlice?.(item)}
                  className="p-2.5 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md flex flex-col justify-between shadow-2xs gap-1 cursor-pointer hover:bg-white/90 hover:shadow-sm transition-all"
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
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center border border-orange-100">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xs">
              No allocation data available for this reporting period.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

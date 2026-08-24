import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import { cardRevealVariants } from '../../lib/animations';
import { DemandRecord } from '../../types';
import { calculateAgeingMetrics } from '../../utils/ageingUtils';
import { DateFilterPreset, filterRecordsByDatePreset, analyzeDatePresets } from '../../utils/dateFilterUtils';
import { DatePresetFilter } from '../common/DatePresetFilter';

interface AgeingDistributionChartProps {
  records: DemandRecord[];
  snapshotWeek?: string;
  onSelectBucket?: (bucketName: string, records: DemandRecord[]) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel p-2.5 rounded-xl shadow-lg border border-white/80 text-xs font-sans">
        <p className="font-semibold text-slate-500 mb-0.5">{data.name}</p>
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: data.color }} />
          <span>{data.value} positions ({data.percentage}%)</span>
        </div>
        <p className="text-[10px] text-blue-600 font-semibold mt-1">Click slice to view records</p>
      </div>
    );
  }
  return null;
};

export const AgeingDistributionChart: React.FC<AgeingDistributionChartProps> = ({
  records = [],
  snapshotWeek,
  onSelectBucket
}) => {
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const availableWeeks = useMemo(() => {
    return Array.from(new Set(records.map(r => r.week).filter(Boolean) as string[]));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return filterRecordsByDatePreset(records, datePreset, customStart, customEnd);
  }, [records, datePreset, customStart, customEnd]);

  const metrics = useMemo(() => {
    return calculateAgeingMetrics(filteredRecords);
  }, [filteredRecords]);

  const currentPeriodLabel = useMemo(() => {
    const info = analyzeDatePresets(availableWeeks);
    if (datePreset === 'all') return 'Distribution across all active demand';
    if (datePreset === 'current_week') return `Current Week · ${info.currentWeek || snapshotWeek || ''}`;
    if (datePreset === 'last_week') return `Last Week · ${info.lastWeek || ''}`;
    if (datePreset === 'this_month') return `This Month · ${info.thisMonthLabel}`;
    if (datePreset === 'last_month') return `Last Month · ${info.lastMonthLabel}`;
    if (datePreset === 'custom' && customStart && customEnd) return `Range · ${customStart} to ${customEnd}`;
    return 'Custom selection';
  }, [datePreset, availableWeeks, snapshotWeek, customStart, customEnd]);

  const totalPositions = useMemo(() => {
    return metrics.bucketDistribution.reduce((acc, curr) => acc + curr.value, 0);
  }, [metrics.bucketDistribution]);

  const handleSliceClick = (bucketName: string) => {
    if (!onSelectBucket) return;
    const inactive = new Set(['Dropped', 'Filled', 'Closed']);
    const active = filteredRecords.filter(r => !inactive.has((r.status || '').trim()));
    onSelectBucket(bucketName, active);
  };

  return (
    <motion.div 
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      className="glass-card rounded-2xl p-5 md:p-6 border border-white/60 flex flex-col justify-between h-full min-h-[340px]"
    >
      <div className="flex items-center justify-between gap-2 mb-3 pb-1 border-b border-slate-100/60">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">Demand Ageing Mix</h3>
          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            {currentPeriodLabel}
          </p>
        </div>

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

      <div className="w-full flex-1 flex flex-col items-center justify-center my-1">
        {totalPositions > 0 ? (
          <div className="w-full flex flex-col items-center justify-between gap-3">
            {/* Donut Pie */}
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={metrics.bucketDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    className="cursor-pointer"
                    onClick={(entry) => handleSliceClick(entry.name)}
                  >
                    {metrics.bucketDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-ageing-${index}`} 
                        fill={entry.color} 
                        className="cursor-pointer hover:opacity-80 transition-opacity" 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900 leading-none">
                  {metrics.overallAvgWeeks}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mt-1">
                  AVG WEEKS
                </span>
              </div>
            </div>

            {/* Legend Pills 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              {metrics.bucketDistribution.map((item) => (
                <div 
                  key={item.name} 
                  onClick={() => handleSliceClick(item.name)}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-semibold text-slate-700 truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 shrink-0 ml-1.5">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-xs text-slate-400">
            No active positions to analyze
          </div>
        )}
      </div>

      {/* Footer Info Pill */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 text-[11px] text-slate-500">
        <span>Fresh (&lt;2 wks): <strong className="text-emerald-600">{metrics.freshPositionsCount} pos</strong></span>
        <span>Aged (&gt;6 wks): <strong className="text-rose-600">{metrics.criticalPositionsCount} pos</strong></span>
      </div>
    </motion.div>
  );
};

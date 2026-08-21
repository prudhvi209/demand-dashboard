import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import { cardRevealVariants } from '../../lib/animations';
import { DemandRecord } from '../../types';
import { calculateAgeingMetrics, ClientAgeingSummary } from '../../utils/ageingUtils';
import { DateFilterPreset, filterRecordsByDatePreset, analyzeDatePresets } from '../../utils/dateFilterUtils';
import { DatePresetFilter } from '../common/DatePresetFilter';

interface CompanyAgeingChartProps {
  records: DemandRecord[];
  snapshotWeek?: string;
  onSelectClient?: (clientName: string) => void;
}

const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ClientAgeingSummary;
    return (
      <div className="glass-panel p-3 rounded-xl shadow-lg border border-white/80 text-xs font-sans">
        <p className="font-bold text-slate-900 mb-1">{data.client}</p>
        <div className="space-y-0.5 text-slate-600">
          <p><span className="font-semibold text-slate-800">Avg Stay:</span> <span className="font-bold text-blue-600">{data.avgAgeingWeeks} weeks</span> ({data.avgAgeingDays} days)</p>
          <p><span className="font-semibold text-slate-800">Max Stay:</span> <span className="font-bold text-rose-500">{data.maxAgeingWeeks} weeks</span></p>
          <p><span className="font-semibold text-slate-800">Active Demand:</span> {data.activeCount} pos</p>
          <p className="text-[10px] text-blue-600 font-semibold mt-1">Click bar to view positions</p>
        </div>
      </div>
    );
  }
  return null;
};

export const CompanyAgeingChart: React.FC<CompanyAgeingChartProps> = ({
  records = [],
  snapshotWeek,
  onSelectClient
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

  const ageingMetrics = useMemo(() => {
    return calculateAgeingMetrics(filteredRecords);
  }, [filteredRecords]);

  // Top 6 companies by average stay duration
  const topAgingClients = useMemo(() => {
    return ageingMetrics.clientSummaries.slice(0, 6);
  }, [ageingMetrics.clientSummaries]);

  const currentPeriodLabel = useMemo(() => {
    const info = analyzeDatePresets(availableWeeks);
    if (datePreset === 'all') return 'Average open duration across all weeks';
    if (datePreset === 'current_week') return `Current Week · ${info.currentWeek || snapshotWeek || ''}`;
    if (datePreset === 'last_week') return `Last Week · ${info.lastWeek || ''}`;
    if (datePreset === 'this_month') return `This Month · ${info.thisMonthLabel}`;
    if (datePreset === 'last_month') return `Last Month · ${info.lastMonthLabel}`;
    if (datePreset === 'custom' && customStart && customEnd) return `Range · ${customStart} to ${customEnd}`;
    return 'Custom selection';
  }, [datePreset, availableWeeks, snapshotWeek, customStart, customEnd]);

  const getBarColor = (weeks: number) => {
    if (weeks > 4) return '#ef4444'; // Red
    if (weeks >= 2.5) return '#f59e0b'; // Amber
    return '#3b82f6'; // Blue
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
          <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">Company Ageing Leaderboard</h3>
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

      <div className="w-full flex-1 flex flex-col justify-center my-1">
        {topAgingClients.length > 0 ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topAgingClients}
                layout="vertical"
                margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
              >
                <XAxis 
                  type="number" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                  unit=" wks" 
                  axisLine={{ stroke: '#f1f5f9' }}
                  tickLine={false}
                />
                <YAxis 
                  dataKey="client" 
                  type="category" 
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} 
                  width={90} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar 
                  dataKey="avgAgeingWeeks" 
                  radius={[0, 6, 6, 0]}
                  animationDuration={800}
                >
                  {topAgingClients.map((entry, idx) => (
                    <Cell 
                      key={`cell-bar-${idx}`} 
                      fill={getBarColor(entry.avgAgeingWeeks)} 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onSelectClient?.(entry.client)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-xs text-slate-400">
            No active company records to analyze
          </div>
        )}
      </div>

      {/* Footer Info Pill */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 text-[11px] text-slate-500">
        <span>Average stay across all companies: <strong className="text-slate-900">{ageingMetrics.overallAvgWeeks} wks</strong></span>
        <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => onSelectClient?.(topAgingClients[0]?.client || '')}>
          Max: {ageingMetrics.longestStayingClient} ({ageingMetrics.overallMaxWeeks} wks)
        </span>
      </div>
    </motion.div>
  );
};

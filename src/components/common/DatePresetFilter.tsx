import React, { useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateFilterPreset, analyzeDatePresets } from '../../utils/dateFilterUtils';

interface DatePresetFilterProps {
  weeks: string[];
  preset: DateFilterPreset;
  customStart?: string;
  customEnd?: string;
  onPresetChange: (preset: DateFilterPreset) => void;
  onCustomChange?: (start: string, end: string) => void;
  className?: string;
  compact?: boolean;
}

export const DatePresetFilter: React.FC<DatePresetFilterProps> = ({
  weeks,
  preset,
  customStart,
  customEnd,
  onPresetChange,
  onCustomChange,
  className = '',
  compact = false
}) => {
  const info = useMemo(() => analyzeDatePresets(weeks), [weeks]);
  const sorted = info.sortedWeeks;

  if (sorted.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 flex-nowrap shrink-0 ${className}`}>
      <div className="relative inline-flex items-center">
        <Calendar className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
        <select
          value={preset}
          onChange={(e) => {
            const next = e.target.value as DateFilterPreset;
            onPresetChange(next);
            if (next === 'custom' && onCustomChange && (!customStart || !customEnd)) {
              onCustomChange(sorted[0] || '', sorted[sorted.length - 1] || '');
            }
          }}
          className={`appearance-none bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/90 text-slate-700 font-semibold rounded-lg ${
            compact 
              ? 'text-[10px] pl-5 pr-5 py-0.5 max-w-[110px] sm:max-w-none' 
              : 'text-[11px] pl-6 pr-6 py-1 max-w-[130px] sm:max-w-none'
          } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs transition-all truncate`}
          title="Filter by time period"
        >
          <option value="current_week">Current Week</option>
          {info.lastWeek && info.lastWeek !== info.currentWeek && (
            <option value="last_week">Last Week</option>
          )}
          {info.thisMonthWeeks.length > 0 && (
            <option value="this_month">This Month</option>
          )}
          {info.lastMonthWeeks.length > 0 && (
            <option value="last_month">Last Month</option>
          )}
          <option value="custom">Custom...</option>
          <option value="all">All Time</option>
        </select>
        <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 pointer-events-none" />
      </div>

      {preset === 'custom' && onCustomChange && (
        <div className="flex items-center gap-1 bg-slate-50/90 border border-slate-200/90 rounded-lg p-0.5 shadow-2xs shrink-0">
          <select
            value={customStart || sorted[0]}
            onChange={(e) => onCustomChange(e.target.value, customEnd || sorted[sorted.length - 1])}
            className="bg-transparent text-slate-700 text-[10px] font-semibold px-1 py-0.5 focus:outline-none cursor-pointer"
          >
            {sorted.map((w) => (
              <option key={`start-${w}`} value={w}>
                {w}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 font-medium">-</span>
          <select
            value={customEnd || sorted[sorted.length - 1]}
            onChange={(e) => onCustomChange(customStart || sorted[0], e.target.value)}
            className="bg-transparent text-slate-700 text-[10px] font-semibold px-1 py-0.5 focus:outline-none cursor-pointer"
          >
            {sorted.map((w) => (
              <option key={`end-${w}`} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

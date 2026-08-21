import { DemandRecord, WowTrendPoint } from '../types';

export type DateFilterPreset = 'all' | 'current_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

export const parseWeekDate = (weekStr: string): Date | null => {
  if (!weekStr) return null;
  const clean = weekStr.trim();
  
  // Format "DD-MMM-YY" (e.g. 29-Jul-26) or "DD-MMM-YYYY"
  const dmyMatch = clean.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthStr = dmyMatch[2].toLowerCase();
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = months[monthStr.substring(0, 3)] ?? 0;
    return new Date(year, month, day);
  }

  // Format "YYYY-MM-DD"
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
  }

  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Sort week strings chronologically
export const sortWeeksChronologically = (weeks: string[]): string[] => {
  return Array.from(new Set(weeks.filter(Boolean))).sort((a, b) => {
    const da = parseWeekDate(a);
    const db = parseWeekDate(b);
    if (!da && !db) return a.localeCompare(b);
    if (!da) return -1;
    if (!db) return 1;
    return da.getTime() - db.getTime();
  });
};

export interface DateFilterContextInfo {
  sortedWeeks: string[];
  currentWeek: string;
  lastWeek: string;
  thisMonthWeeks: string[];
  lastMonthWeeks: string[];
  thisMonthLabel: string;
  lastMonthLabel: string;
}

export const analyzeDatePresets = (weeks: string[]): DateFilterContextInfo => {
  const sortedWeeks = sortWeeksChronologically(weeks);
  if (sortedWeeks.length === 0) {
    return {
      sortedWeeks: [],
      currentWeek: '',
      lastWeek: '',
      thisMonthWeeks: [],
      lastMonthWeeks: [],
      thisMonthLabel: 'This Month',
      lastMonthLabel: 'Last Month'
    };
  }

  const currentWeek = sortedWeeks[sortedWeeks.length - 1];
  const lastWeek = sortedWeeks.length > 1 ? sortedWeeks[sortedWeeks.length - 2] : currentWeek;

  const latestDate = parseWeekDate(currentWeek);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (!latestDate) {
    return {
      sortedWeeks,
      currentWeek,
      lastWeek,
      thisMonthWeeks: [currentWeek],
      lastMonthWeeks: lastWeek !== currentWeek ? [lastWeek] : [],
      thisMonthLabel: 'This Month',
      lastMonthLabel: 'Last Month'
    };
  }

  const curYear = latestDate.getFullYear();
  const curMonth = latestDate.getMonth();

  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const prevYear = curMonth === 0 ? curYear - 1 : curYear;

  const thisMonthLabel = `${monthNames[curMonth]} ${curYear}`;
  const lastMonthLabel = `${monthNames[prevMonth]} ${prevYear}`;

  const thisMonthWeeks = sortedWeeks.filter((w) => {
    const d = parseWeekDate(w);
    return d && d.getFullYear() === curYear && d.getMonth() === curMonth;
  });

  const lastMonthWeeks = sortedWeeks.filter((w) => {
    const d = parseWeekDate(w);
    return d && d.getFullYear() === prevYear && d.getMonth() === prevMonth;
  });

  return {
    sortedWeeks,
    currentWeek,
    lastWeek,
    thisMonthWeeks,
    lastMonthWeeks,
    thisMonthLabel,
    lastMonthLabel
  };
};

/**
 * Filter an array of records by date preset
 */
export const filterRecordsByDatePreset = (
  records: DemandRecord[],
  preset: DateFilterPreset,
  customStart?: string,
  customEnd?: string
): DemandRecord[] => {
  if (!records || records.length === 0) return [];
  if (preset === 'all') return records;

  const weeks = Array.from(new Set(records.map(r => r.week).filter(Boolean) as string[]));
  const info = analyzeDatePresets(weeks);

  if (preset === 'current_week') {
    return records.filter(r => r.week === info.currentWeek);
  }

  if (preset === 'last_week') {
    return records.filter(r => r.week === info.lastWeek);
  }

  if (preset === 'this_month') {
    const matching = new Set(info.thisMonthWeeks);
    return records.filter(r => r.week && matching.has(r.week));
  }

  if (preset === 'last_month') {
    const matching = new Set(info.lastMonthWeeks);
    return records.filter(r => r.week && matching.has(r.week));
  }

  if (preset === 'custom' && customStart && customEnd) {
    const sorted = info.sortedWeeks;
    const startIdx = sorted.indexOf(customStart);
    const endIdx = sorted.indexOf(customEnd);
    if (startIdx !== -1 && endIdx !== -1) {
      const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      const valid = new Set(sorted.slice(from, to + 1));
      return records.filter(r => r.week && valid.has(r.week));
    }
  }

  return records;
};

/**
 * Filter WowTrendPoint points by date preset
 */
export const filterWowTrendsByDatePreset = (
  data: WowTrendPoint[],
  preset: DateFilterPreset,
  customStart?: string,
  customEnd?: string
): WowTrendPoint[] => {
  if (!data || data.length === 0) return [];
  if (preset === 'all') return data;

  const weeks = data.map(d => d.week);
  const info = analyzeDatePresets(weeks);

  if (preset === 'current_week') {
    return data.filter(d => d.week === info.currentWeek);
  }

  if (preset === 'last_week') {
    return data.filter(d => d.week === info.lastWeek);
  }

  if (preset === 'this_month') {
    const matching = new Set(info.thisMonthWeeks);
    return data.filter(d => matching.has(d.week));
  }

  if (preset === 'last_month') {
    const matching = new Set(info.lastMonthWeeks);
    return data.filter(d => matching.has(d.week));
  }

  if (preset === 'custom' && customStart && customEnd) {
    const startIdx = data.findIndex(d => d.week === customStart);
    const endIdx = data.findIndex(d => d.week === customEnd);
    if (startIdx !== -1 && endIdx !== -1) {
      const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      return data.slice(from, to + 1);
    }
  }

  return data;
};

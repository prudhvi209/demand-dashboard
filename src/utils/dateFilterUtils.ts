import { DemandRecord, WowTrendPoint } from '../types';

export type DateFilterPreset = 'all' | 'current_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

/**
 * Convert Excel/SheetJS date values into a Date object.
 * Supports:
 * - JavaScript Date
 * - Excel serial number
 * - YYYY-MM-DD strings
 * - DD-MMM-YY / DD-MMM-YYYY strings
 * - normal date strings
 */
export function toDate(value: any): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Already a Date
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );
  }

  // Excel serial date number
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(Date.UTC(1899, 11, 30 + value));

    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
  }

  // String
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Excel serial stored as string
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const serial = Number(trimmed);
      const date = new Date(Date.UTC(1899, 11, 30 + serial));

      return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
      );
    }

    // Format "DD-MMM-YY" (e.g. 24-Jun-26) or "DD-MMM-YYYY"
    const dmyMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
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
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    }

    // Format "DD/MM/YYYY" or "DD/MM/YY"
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slashMatch) {
      const p1 = parseInt(slashMatch[1], 10);
      const p2 = parseInt(slashMatch[2], 10);
      let year = parseInt(slashMatch[3], 10);
      if (year < 100) year += 2000;
      if (p2 <= 12) {
        return new Date(year, p2 - 1, p1);
      } else {
        return new Date(year, p1 - 1, p2);
      }
    }

    const parsed = new Date(trimmed);

    if (!Number.isNaN(parsed.getTime())) {
      return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
    }
  }

  return null;
}

// Backwards compatibility alias for parseWeekDate
export const parseWeekDate = toDate;

/**
 * Normalize text so that small differences don't create
 * separate demand records.
 */
export function normalizeValue(value: any): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Convert date into YYYY-MM-DD.
 */
export function dateKey(value: any): string {
  const date = toDate(value);
  if (!date) return '';

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

/**
 * Create a stable key representing the actual demand.
 *
 * IMPORTANT:
 * Do NOT include:
 * - Week
 * - Position Status
 * - Oppo Stage
 * - EMP Name
 *
 * Those values can change from one weekly snapshot to another.
 */
export function createDemandKey(row: any): string {
  const client = row['Client'] ?? row.client;
  const opportunityName = row['Opportunity Name'] ?? row.opportunityName;
  const role = row['Role'] ?? row.position;
  const startDate = row['Start Date'] ?? row.dateAdded;
  const location = row['Location'] ?? row.location;
  const internalExternal = row['Internal / External'] ?? row['Internal/External'] ?? row.internalExternal;

  return [
    normalizeValue(client),
    normalizeValue(opportunityName),
    normalizeValue(role),
    dateKey(startDate),
    normalizeValue(location),
    normalizeValue(internalExternal)
  ].join('||');
}

export function toNumber(value: any): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

/**
 * Get unique demand for a complete month.
 *
 * Example:
 * getUniqueMonthlyDemand(rows, "2026-07")
 *
 * Behaviour:
 * - considers every weekly snapshot in the selected month
 * - identifies repeated demand across weeks using createDemandKey
 * - keeps only the latest weekly snapshot of each unique demand
 * - combines duplicate rows inside that latest snapshot
 * - returns clean records for Client Distribution, Location, KPI, and dashboard calculations
 */
export function getUniqueMonthlyDemand<T = any>(rows: T[], selectedMonth?: string | Date): T[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  // ---------------------------------------------------------
  // 1. Determine selected month
  // ---------------------------------------------------------
  let year: number;
  let month: number; // 0-indexed (0 = Jan, 6 = Jul, 7 = Aug)

  const isCurrentMonthPreset =
    !selectedMonth ||
    selectedMonth === 'This Month' ||
    selectedMonth === 'this-month' ||
    selectedMonth === 'this_month' ||
    selectedMonth === 'current_month';

  const isLastMonthPreset =
    selectedMonth === 'Last Month' ||
    selectedMonth === 'last-month' ||
    selectedMonth === 'last_month' ||
    selectedMonth === 'previous_month';

  if (isCurrentMonthPreset || isLastMonthPreset) {
    // Determine the latest reference week in the dataset
    const weeksInData = rows
      .map((r: any) => toDate(r['Week'] ?? r.week))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    const refDate = weeksInData.length > 0 ? weeksInData[weeksInData.length - 1] : new Date();

    if (isCurrentMonthPreset) {
      year = refDate.getFullYear();
      month = refDate.getMonth();
    } else {
      const curMonth = refDate.getMonth();
      const curYear = refDate.getFullYear();
      month = curMonth === 0 ? 11 : curMonth - 1;
      year = curMonth === 0 ? curYear - 1 : curYear;
    }
  } else if (selectedMonth instanceof Date) {
    year = selectedMonth.getFullYear();
    month = selectedMonth.getMonth();
  } else if (typeof selectedMonth === 'string') {
    const trimmedMonth = selectedMonth.trim();
    if (/^\d{4}-\d{2}$/.test(trimmedMonth)) {
      const [selectedYear, selectedMonthNumber] = trimmedMonth.split('-').map(Number);
      year = selectedYear;
      month = selectedMonthNumber - 1;
    } else {
      const parsedDate = toDate(trimmedMonth);
      if (parsedDate) {
        year = parsedDate.getFullYear();
        month = parsedDate.getMonth();
      } else {
        const d = new Date(trimmedMonth);
        if (!isNaN(d.getTime())) {
          year = d.getFullYear();
          month = d.getMonth();
        } else {
          throw new Error(
            `Invalid selectedMonth: ${selectedMonth}. Use "YYYY-MM" or "This Month".`
          );
        }
      }
    }
  } else {
    throw new Error(
      `Invalid selectedMonth: ${selectedMonth}. Use "YYYY-MM" or "This Month".`
    );
  }

  const monthStart = new Date(year, month, 1);
  const nextMonthStart = new Date(year, month + 1, 1);

  // ---------------------------------------------------------
  // 2. Filter all rows belonging to the selected month
  // ---------------------------------------------------------
  const monthRows = rows.filter((row: any) => {
    const weekDate = toDate(row['Week'] ?? row.week);

    if (!weekDate) {
      return false;
    }

    return weekDate >= monthStart && weekDate < nextMonthStart;
  });

  // ---------------------------------------------------------
  // 3. Sort snapshots from oldest → newest
  // ---------------------------------------------------------
  monthRows.sort((a: any, b: any) => {
    const dateA = toDate(a['Week'] ?? a.week);
    const dateB = toDate(b['Week'] ?? b.week);

    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    return dateA.getTime() - dateB.getTime();
  });

  // ---------------------------------------------------------
  // 4. Store latest version of each unique demand
  // ---------------------------------------------------------
  const latestDemand = new Map<string, any>();

  for (const row of monthRows) {
    const demandKey = createDemandKey(row);
    const weekDate = toDate((row as any)['Week'] ?? (row as any).week);

    if (!demandKey || !weekDate) {
      continue;
    }

    const existing = latestDemand.get(demandKey);

    const posCount = toNumber((row as any)['Positions'] ?? (row as any).requiredCount ?? 1);
    const openCount = toNumber((row as any)['Open Positions'] ?? (row as any).openCount);
    const closedCount = toNumber((row as any)['Closed Positions'] ?? (row as any).closedCount);
    const droppedCount = toNumber((row as any)['Dropped Positions'] ?? (row as any).droppedCount);
    const newCount = toNumber((row as any)['New Positions'] ?? (row as any).newCount);

    // -------------------------------------------------------
    // First occurrence of this demand
    // -------------------------------------------------------
    if (!existing) {
      latestDemand.set(demandKey, {
        ...row,
        __demandKey: demandKey,
        __weekDate: weekDate,

        Positions: posCount,
        requiredCount: posCount,
        'Open Positions': openCount,
        openCount: openCount,
        'Closed Positions': closedCount,
        closedCount: closedCount,
        'Dropped Positions': droppedCount,
        droppedCount: droppedCount,
        'New Positions': newCount,
        newCount: newCount
      });

      continue;
    }

    const existingWeek: Date = existing.__weekDate;

    // -------------------------------------------------------
    // Newer weekly snapshot → replace old snapshot
    // -------------------------------------------------------
    if (weekDate.getTime() > existingWeek.getTime()) {
      latestDemand.set(demandKey, {
        ...row,
        __demandKey: demandKey,
        __weekDate: weekDate,

        Positions: posCount,
        requiredCount: posCount,
        'Open Positions': openCount,
        openCount: openCount,
        'Closed Positions': closedCount,
        closedCount: closedCount,
        'Dropped Positions': droppedCount,
        droppedCount: droppedCount,
        'New Positions': newCount,
        newCount: newCount
      });

      continue;
    }

    // -------------------------------------------------------
    // Same weekly snapshot → combine duplicate rows
    // -------------------------------------------------------
    if (weekDate.getTime() === existingWeek.getTime()) {
      existing.Positions = (existing.Positions || 0) + posCount;
      existing.requiredCount = existing.Positions;

      existing['Open Positions'] = (existing['Open Positions'] || 0) + openCount;
      existing.openCount = existing['Open Positions'];

      existing['Closed Positions'] = (existing['Closed Positions'] || 0) + closedCount;
      existing.closedCount = existing['Closed Positions'];

      existing['Dropped Positions'] = (existing['Dropped Positions'] || 0) + droppedCount;
      existing.droppedCount = existing['Dropped Positions'];

      existing['New Positions'] = (existing['New Positions'] || 0) + newCount;
      existing.newCount = existing['New Positions'];
    }
  }

  // ---------------------------------------------------------
  // 5. Convert Map to array
  // ---------------------------------------------------------
  return Array.from(latestDemand.values()).map((row) => {
    const cleanRow = { ...row };

    delete cleanRow.__demandKey;
    delete cleanRow.__weekDate;

    // Always calculate Total Positions from Positions
    cleanRow['Total Positions'] = cleanRow.Positions;
    cleanRow['totalPositions'] = cleanRow.Positions;

    return cleanRow as T;
  });
}

// Formats any date input into canonical DD-MMM-YY display week (e.g. 24-Jun-26)
export const formatDateToCanonicalWeek = (val: any, fallback: string = '24-Jun-26'): string => {
  const d = toDate(val);
  if (!d) return typeof val === 'string' && val.trim() ? val.trim() : fallback;
  
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()] || 'Jun';
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

// Sort week strings chronologically
export const sortWeeksChronologically = (weeks: string[]): string[] => {
  return Array.from(new Set(weeks.filter(Boolean))).sort((a, b) => {
    const da = toDate(a);
    const db = toDate(b);
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

  const latestDate = toDate(currentWeek);
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
    const d = toDate(w);
    return d && d.getFullYear() === curYear && d.getMonth() === curMonth;
  });

  const lastMonthWeeks = sortedWeeks.filter((w) => {
    const d = toDate(w);
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
 * Filter an array of records by date preset.
 * When monthly presets are used, returns deduplicated unique monthly demand!
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
    return getUniqueMonthlyDemand(records, 'this_month');
  }

  if (preset === 'last_month') {
    return getUniqueMonthlyDemand(records, 'last_month');
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


import * as XLSX from 'xlsx';
import { 
  DemandRecord, 
  AnalyticsSummary, 
  UploadHistoryItem,
  FilterState,
  WowTrendPoint,
  IntVsExtDistributionData,
  IntVsExtTrendPoint,
  DepartmentDistributionData
} from '../types';
import { 
  sortWeeksChronologically, 
  formatDateToCanonicalWeek, 
  parseWeekDate,
  toDate,
  getUniqueMonthlyDemand,
  createDemandKey,
  normalizeValue,
  toNumber
} from './dateFilterUtils';
import { 
  normalizeStatus, 
  isActiveRecord, 
  isDroppedRecord, 
  isFilledRecord, 
  isOpenRecord, 
  isIdentifiedRecord, 
  isHoldRecord 
} from './statusUtils';

export { getUniqueMonthlyDemand, toDate, createDemandKey, normalizeValue, toNumber };

export interface ParseResult {
  records: DemandRecord[];
  summary: AnalyticsSummary;
  uploadHistoryItem: UploadHistoryItem;
  wowTrends: WowTrendPoint[];
  intVsExtDistribution: IntVsExtDistributionData[];
  clientDistribution: DepartmentDistributionData[];
  validationMetrics: {
    totalRows: number;
    validCount: number;
    skippedCount: number;
    missingColumns?: string[];
  };
}

export const calculateAnalyticsSummary = (records: DemandRecord[]): AnalyticsSummary => {
  const emptySnapshot = {
    latestTotalFTE: 0,
    latestOpenFTE: 0,
    latestIdentifiedFTE: 0,
    latestHoldFTE: 0,
    latestActiveDemandFTE: 0,
    latestDroppedFTE: 0,
    latestClosedThisWeek: 0,
    latestInternalFTE: 0,
    latestExternalFTE: 0,
    latestSnapshotWeek: '',
    cumulativeClosed: 0,
    cumulativeDropped: 0,
    cumulativeNew: 0
  };

  if (!records || records.length === 0) {
    return {
      currentDemand: 0,
      benchEmployees: 0,
      openPositions: 0,
      closedPositions: 0,
      droppedPositions: 0,
      newPositions: 0,
      totalClients: 0,
      totalPositions: 0,
      demandPercentage: 0,
      fulfillmentRate: 0,
      benchPercentage: 0,
      lastUpdated: 'No Data Uploaded',
      ...emptySnapshot
    };
  }

  // ── Dynamically detect the latest snapshot week chronologically ────────────
  const weeksInData = Array.from(new Set(records.map(r => r.week).filter(Boolean) as string[]));
  const sortedWeeks = sortWeeksChronologically(weeksInData);
  const latestWeek = sortedWeeks.length > 0 ? sortedWeeks[sortedWeeks.length - 1] : (records[0]?.week || '');

  const latestRows = records.filter(r => r.week === latestWeek);

  // ── Cumulative pass across all records ─────────────────────────────────────
  let totalPositions = 0;
  let totalOpen = 0;
  let totalClosed = 0;
  let totalDropped = 0;
  let totalNew = 0;
  let totalBench = 0;
  let openReqCount = 0;
  const clientsSet = new Set<string>();

  records.forEach((r) => {
    const pos = r.requiredCount || 1;
    totalPositions += pos;

    const isDropped = isDroppedRecord(r);
    const isClosed = isFilledRecord(r);
    const isActive = isActiveRecord(r);

    const openCount = r.openCount !== undefined ? r.openCount : (isActive ? pos : 0);
    const closedCount = r.closedCount !== undefined ? r.closedCount : (isClosed ? pos : 0);
    const droppedCount = r.droppedCount !== undefined ? r.droppedCount : (isDropped ? pos : 0);
    const newCount = r.newCount !== undefined ? r.newCount : 0;

    if (isActive) totalOpen += openCount;
    totalClosed += closedCount;
    totalDropped += droppedCount;
    totalNew += newCount;
    if (isActive && openCount > 0) openReqCount++;

    if (r.internalExternal?.toLowerCase().includes('internal') || r.status?.toLowerCase().includes('bench')) {
      totalBench += pos;
    }
    if (r.client) clientsSet.add(r.client.trim());
  });

  // ── Latest snapshot pass (using strict active / dropped / closed status) ────
  let latestTotal = 0;
  let latestOpen = 0;
  let latestIdentified = 0;
  let latestHold = 0;
  let latestDropped = 0;
  let latestClosedWeek = 0;
  let latestInternal = 0;
  let latestExternal = 0;

  latestRows.forEach((r) => {
    const pos = r.requiredCount || 1;
    latestTotal += pos;

    if (isDroppedRecord(r)) {
      latestDropped += pos;
    } else if (isFilledRecord(r)) {
      latestClosedWeek += pos;
    } else if (isIdentifiedRecord(r)) {
      latestIdentified += pos;
    } else if (isHoldRecord(r)) {
      latestHold += pos;
    } else if (isOpenRecord(r)) {
      latestOpen += pos;
    } else {
      latestOpen += pos;
    }

    // Internal vs External: only count active requirements
    if (isActiveRecord(r)) {
      if (r.internalExternal?.toLowerCase().includes('internal') || r.status?.toLowerCase().includes('bench')) {
        latestInternal += pos;
      } else {
        latestExternal += pos;
      }
    }
  });

  const latestActive = latestOpen + latestIdentified + latestHold;

  const demandPercentage = totalPositions > 0 ? Math.round((totalOpen / totalPositions) * 1000) / 10 : 0;
  const fulfillmentRate = totalPositions > 0 ? Math.round((totalClosed / totalPositions) * 1000) / 10 : 0;
  const benchPercentage = totalPositions > 0 ? Math.round((totalBench / totalPositions) * 1000) / 10 : 0;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    currentDemand: Math.round(totalOpen),
    benchEmployees: Math.round(totalBench),
    openPositions: openReqCount,
    closedPositions: Math.round(totalClosed),
    droppedPositions: Math.round(totalDropped),
    newPositions: Math.round(totalNew),
    totalClients: clientsSet.size,
    totalPositions: Math.round(totalPositions),
    demandPercentage,
    fulfillmentRate,
    benchPercentage,
    lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),

    // Latest snapshot
    latestTotalFTE: round2(latestTotal),
    latestOpenFTE: round2(latestOpen),
    latestIdentifiedFTE: round2(latestIdentified),
    latestHoldFTE: round2(latestHold),
    latestActiveDemandFTE: round2(latestActive),
    latestDroppedFTE: round2(latestDropped),
    latestClosedThisWeek: round2(latestClosedWeek),
    latestInternalFTE: round2(latestInternal),
    latestExternalFTE: round2(latestExternal),
    latestSnapshotWeek: latestWeek,

    // Cumulative
    cumulativeClosed: Math.round(totalClosed),
    cumulativeDropped: Math.round(totalDropped),
    cumulativeNew: Math.round(totalNew)
  };
};

// Filter records by Relative Period or Custom Date Range
export const filterDemandRecords = (records: DemandRecord[], filters: FilterState): DemandRecord[] => {
  if (!records || records.length === 0) return [];

  const uniqueWeeks = sortWeeksChronologically(Array.from(new Set(records.map(r => r.week).filter(Boolean) as string[])));
  const latestWeek = uniqueWeeks[uniqueWeeks.length - 1];
  const previousWeek = uniqueWeeks.length > 1 ? uniqueWeeks[uniqueWeeks.length - 2] : uniqueWeeks[0];

  // 1. Apply slicers and custom date range
  const filtered = records.filter((r) => {
    // Slicers
    if (filters.department && filters.department !== 'all') {
      if (r.department?.toLowerCase().trim() !== filters.department.toLowerCase().trim()) return false;
    }
    if (filters.client && filters.client !== 'all') {
      if (r.client?.toLowerCase().trim() !== filters.client.toLowerCase().trim()) return false;
    }
    if (filters.status && filters.status !== 'all') {
      if (r.status?.toLowerCase().trim() !== filters.status.toLowerCase().trim()) return false;
    }
    if (filters.ed && filters.ed !== 'all') {
      if (r.dealOwner?.toLowerCase().trim() !== filters.ed.toLowerCase().trim()) return false;
    }
    if (filters.location && filters.location !== 'all') {
      if (r.location?.toLowerCase().trim() !== filters.location.toLowerCase().trim()) return false;
    }

    // Custom Date Range
    if (filters.startDate) {
      if (r.dateAdded && r.dateAdded < filters.startDate) return false;
    }
    if (filters.endDate) {
      if (r.dateAdded && r.dateAdded > filters.endDate) return false;
    }

    // Single week relative periods
    if (filters.period === 'current_week') {
      if (r.week !== latestWeek) return false;
    }
    if (filters.period === 'last_week') {
      if (r.week !== previousWeek) return false;
    }

    return true;
  });

  // 2. Apply monthly deduplication if month relative period selected
  if (filters.period === 'current_month') {
    return getUniqueMonthlyDemand(filtered, 'current_month');
  }

  if (filters.period === 'previous_month') {
    return getUniqueMonthlyDemand(filtered, 'previous_month');
  }

  return filtered;
};

// WOW (Week-over-Week) Weekly Trend Series Aggregator
export const aggregateWowTrends = (records: DemandRecord[]): WowTrendPoint[] => {
  if (!records || records.length === 0) return [];

  const weekMap: Record<string, { total: number; newPos: number; open: number; filled: number; dropped: number }> = {};

  records.forEach((r) => {
    const week = r.week || (r as any)['Week'] || '24-Jun-26';
    if (!weekMap[week]) {
      weekMap[week] = { total: 0, newPos: 0, open: 0, filled: 0, dropped: 0 };
    }
    const pos = r.requiredCount || (r as any)['Positions'] || 1;
    
    // Strict semantic activity check — isActiveRecord now excludes Dropped/Filled by status keyword first
    const isDropped = isDroppedRecord(r);
    const isClosed = isFilledRecord(r);
    const isActive = isActiveRecord(r);

    // Use requiredCount as the active FTE count; openCount columns are often 0 in raw spreadsheets
    const open = isActive ? pos : 0;
    const closed = isClosed ? (r.closedCount !== undefined && r.closedCount > 0 ? r.closedCount : pos) : 0;
    const dropped = isDropped ? (r.droppedCount !== undefined && r.droppedCount > 0 ? r.droppedCount : pos) : 0;
    const newPos = r.newCount !== undefined && r.newCount > 0 ? r.newCount : (r.status?.toLowerCase().includes('new') ? pos : 0);

    weekMap[week].total += pos;
    weekMap[week].newPos += newPos;
    weekMap[week].open += open;
    weekMap[week].filled += closed;
    weekMap[week].dropped += dropped;
  });

  const sortedWeeks = sortWeeksChronologically(Object.keys(weekMap));
  return sortedWeeks.map((w) => {
    const val = weekMap[w];
    return {
      week: w,
      totalDemand: Math.round(val.total),
      newDemand: Math.round(val.newPos),
      openDemand: Math.round(val.open),
      filledDemand: Math.round(val.filled),
      droppedDemand: Math.round(val.dropped)
    };
  });
};

// Internal vs External Distribution Aggregator (Active demand only — excludes Dropped/Filled)
export const aggregateIntVsExtDistribution = (records: DemandRecord[]): IntVsExtDistributionData[] => {
  if (!records || records.length === 0) return [];

  let internalCount = 0;
  let externalCount = 0;

  // Only count records that are truly active (Open, Identified, Hold)
  const activeRecords = records.filter(r => isActiveRecord(r));

  activeRecords.forEach((r) => {
    const pos = r.requiredCount || (r as any)['Positions'] || 1;
    const intExt = (r.internalExternal || (r as any)['Internal / External'] || (r as any)['Internal/External'] || '').toLowerCase();
    const st = (r.status || (r as any)['Position Status'] || '').toLowerCase();
    if (intExt.includes('internal') || st.includes('bench')) {
      internalCount += pos;
    } else {
      externalCount += pos;
    }
  });

  const total = internalCount + externalCount;
  const internalPct = total > 0 ? Math.round((internalCount / total) * 100) : 0;
  const externalPct = total > 0 ? 100 - internalPct : 0;

  return [
    { name: 'Internal', value: Math.round(internalCount), percentage: internalPct, color: '#f97316' },
    { name: 'External', value: Math.round(externalCount), percentage: externalPct, color: '#0284c7' }
  ];
};

// Internal vs External Week-over-Week Trend Aggregator (Active demand only — excludes Dropped/Filled)
export const aggregateIntVsExtTrend = (records: DemandRecord[]): IntVsExtTrendPoint[] => {
  if (!records || records.length === 0) return [];

  const weekMap: Record<string, { internal: number; external: number }> = {};

  records.forEach((r) => {
    if (!isActiveRecord(r)) return; // active only
    const week = r.week || (r as any)['Week'] || '';
    if (!week) return;
    if (!weekMap[week]) weekMap[week] = { internal: 0, external: 0 };
    const pos = r.requiredCount || (r as any)['Positions'] || 1;
    const intExt = (r.internalExternal || (r as any)['Internal / External'] || (r as any)['Internal/External'] || '').toLowerCase();
    const st = (r.status || (r as any)['Position Status'] || '').toLowerCase();
    if (intExt.includes('internal') || st.includes('bench')) {
      weekMap[week].internal += pos;
    } else {
      weekMap[week].external += pos;
    }
  });

  const sortedWeeks = sortWeeksChronologically(Object.keys(weekMap));
  return sortedWeeks.map((w) => ({
    week: w,
    internal: Math.round(weekMap[w].internal),
    external: Math.round(weekMap[w].external)
  }));
};

// Location Distribution Aggregator (Active demand only — excludes Dropped/Filled)
export const aggregateLocationDistribution = (records: DemandRecord[]): { name: string; value: number; percentage: number; color: string }[] => {
  if (!records || records.length === 0) return [];

  const locationCounts: Record<string, number> = {};
  let total = 0;

  // Only count active records
  const activeRecords = records.filter(r => isActiveRecord(r));

  activeRecords.forEach((r) => {
    const loc = (r.location || (r as any)['Location'] || 'Offshore').trim();
    const formattedLoc = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
    const pos = r.requiredCount || (r as any)['Positions'] || 1;
    locationCounts[formattedLoc] = (locationCounts[formattedLoc] || 0) + pos;
    total += pos;
  });

  const COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const sorted = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);

  return sorted.map(([name, value], idx) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return {
      name,
      value: Math.round(value),
      percentage: pct,
      color: COLORS[idx % COLORS.length]
    };
  });
};

// Client Position Demand Distribution Aggregator (Active demand only — Top 5 + Others grouping)
export const aggregateClientDistribution = (records: DemandRecord[]): DepartmentDistributionData[] => {
  if (!records || records.length === 0) return [];

  const clientCounts: Record<string, number> = {};

  // Only count active records (Open, Identified, Hold — not Dropped/Filled)
  const activeRecords = records.filter(r => isActiveRecord(r));

  activeRecords.forEach((r) => {
    const client = r.client || (r as any)['Client'] || r.department || 'Delivery';
    const pos = r.requiredCount || (r as any)['Positions'] || 1;
    clientCounts[client] = (clientCounts[client] || 0) + pos;
  });

  const COLORS = ['#2563eb', '#0ea5e9', '#6366f1', '#f43f5e', '#10b981', '#f59e0b'];
  const sorted = Object.entries(clientCounts).sort((a, b) => b[1] - a[1]);

  if (sorted.length <= 5) {
    return sorted.map(([name, value], idx) => ({
      name,
      value: Math.round(value),
      color: COLORS[idx % COLORS.length]
    }));
  }

  // Top 5 clients
  const top5 = sorted.slice(0, 5).map(([name, value], idx) => ({
    name,
    value: Math.round(value),
    color: COLORS[idx % COLORS.length]
  }));

  // Group remaining into "Others"
  const othersValue = sorted.slice(5).reduce((sum, [_, val]) => sum + val, 0);
  if (othersValue > 0) {
    top5.push({
      name: 'Others',
      value: Math.round(othersValue),
      color: '#94a3b8'
    });
  }

  return top5;
};


// Helper: returns only the records belonging to the latest snapshot week chronologically.
export const getLatestSnapshotRecords = (records: DemandRecord[]): DemandRecord[] => {
  if (!records || records.length === 0) return [];
  const weeksInData = Array.from(new Set(records.map(r => r.week).filter(Boolean) as string[]));
  const sortedWeeks = sortWeeksChronologically(weeksInData);
  const latestWeek = sortedWeeks.length > 0 ? sortedWeeks[sortedWeeks.length - 1] : (records[0]?.week || '');
  return records.filter(r => r.week === latestWeek);
};

// Returns latest-snapshot rows with Dropped / Filled / Closed strictly excluded.
export const getActiveSnapshotRecords = (records: DemandRecord[]): DemandRecord[] => {
  const latestRows = getLatestSnapshotRecords(records);
  return latestRows.filter(r => isActiveRecord(r));
};

// Flexible helper to find any matching key in row with case/space insensitivity
const getRowValue = (row: Record<string, any>, candidates: string[]): any => {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const cleanCand = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCand);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
      return row[foundKey];
    }
  }
  return undefined;
};

export const parseExcelFile = async (file: File, uploaderName: string = 'prudhvi.karri'): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson = XLSX.utils.sheet_to_json<any>(worksheet);

        const totalRows = rawJson.length;
        const validRecords: DemandRecord[] = [];
        let skippedCount = 0;

        rawJson.forEach((row, index) => {
          // Check essential identifier or position fields
          const clientName = getRowValue(row, ['Client', 'Customer', 'Opportunity Name', 'Account', 'Company']);
          const roleTitle = getRowValue(row, ['Role', 'Position', 'Title', 'Primary Skill', 'Skill', 'Requisition Title', 'Job Title']);
          
          if (!clientName && !roleTitle) {
            skippedCount++;
            return;
          }

          const rawPos = getRowValue(row, ['Positions', 'Total Positions', 'Count', 'Headcount', 'No of Positions', 'Openings', 'Required Count']) || '1';
          const posCount = Math.max(1, parseFloat(String(rawPos)) || 1);

          const openCount = parseFloat(String(getRowValue(row, ['Open Positions', 'Open Count', 'Open', 'Active Positions']) || '0')) || 0;
          const closedCount = parseFloat(String(getRowValue(row, ['Closed Positions', 'Closed Count', 'Filled Positions', 'Filled Count', 'Closed', 'Filled']) || '0')) || 0;
          const droppedCount = parseFloat(String(getRowValue(row, ['Dropped Positions', 'Dropped Count', 'Cancelled Positions', 'Lost Positions', 'Dropped', 'Cancelled']) || '0')) || 0;
          const newCount = parseFloat(String(getRowValue(row, ['New Positions', 'New Count', 'New Demand', 'Added Positions', 'New']) || '0')) || 0;

          const rawProb = parseFloat(String(getRowValue(row, ['Oppo Prob', 'Probability', 'Win Probability']) || ''));
          const oppoProb = !isNaN(rawProb) ? rawProb : undefined;

          const rawStatus = getRowValue(row, ['Position Status', 'Status', 'Current Status', 'Stage', 'Oppo Stage', 'Requisition Status']);
          const finalStatus = normalizeStatus(rawStatus, row);

          const rawWeek = getRowValue(row, ['Week', 'Firsttime Fill by Week', 'Snapshot Week', 'Reporting Week', 'Week Ending', 'Date']);
          const canonicalWeek = formatDateToCanonicalWeek(rawWeek);

          const rawDateAdded = getRowValue(row, ['Start Date', 'Created Date', 'Date Added', 'Req Date', 'Date']);
          let dateAddedStr = new Date().toISOString().split('T')[0];
          if (rawDateAdded) {
            const parsedD = parseWeekDate(rawDateAdded);
            if (parsedD) {
              dateAddedStr = parsedD.toISOString().split('T')[0];
            } else {
              dateAddedStr = String(rawDateAdded);
            }
          }

          validRecords.push({
            id: `rec-${1000 + index}`,
            jobId: String(getRowValue(row, ['Job ID', 'JobID', 'Opportunity Name', 'Req ID', 'Requisition ID']) || `REQ-${1000 + index}`),
            client: String(clientName || 'Internal').trim(),
            opportunityName: String(getRowValue(row, ['Opportunity Name', 'Opportunity', 'Deal Name']) || clientName || `Opportunity-${index}`).trim(),
            department: String(getRowValue(row, ['Department', 'Dept', 'Practice', 'BU', 'Business Unit']) || 'Delivery').trim(),
            position: String(roleTitle || 'Engineer').trim(),
            experienceLevel: String(getRowValue(row, ['Experience', 'Level', 'Seniority', 'Exp Level']) || 'Senior').trim(),
            status: finalStatus,
            requiredCount: posCount,
            openCount,
            closedCount,
            droppedCount,
            newCount,
            location: String(getRowValue(row, ['Location', 'Work Location', 'Base Location', 'City']) || 'Offshore').trim(),
            internalExternal: String(getRowValue(row, ['Internal / External', 'Internal/External', 'Int/Ext', 'Source', 'Sourcing', 'Type']) || 'Internal').trim(),
            dealOwner: String(getRowValue(row, ['Deal Owner', 'ED', 'Owner', 'Account Manager', 'Lead']) || '').trim(),
            startMonth: String(getRowValue(row, ['Start Month', 'Joining Month', 'Month']) || 'Aug-2026').trim(),
            dateAdded: dateAddedStr,
            oppoType: getRowValue(row, ['Oppo Type', 'Deal Type', 'Opportunity Type']) ? String(getRowValue(row, ['Oppo Type', 'Deal Type', 'Opportunity Type'])).trim() : undefined,
            oppoProb,
            week: canonicalWeek,
            employeeName: String(getRowValue(row, ['Employee Name', 'Emp Name', 'Candidate Name', 'Candidate', 'Resource Name', 'Employee', 'Selected Candidate']) || '-').trim()
          });
        });

        if (validRecords.length === 0) {
          throw new Error("No valid demand position rows could be extracted from this spreadsheet.");
        }

        const summary = calculateAnalyticsSummary(validRecords);
        const wowTrends = aggregateWowTrends(validRecords);
        const activeSnapshot = getActiveSnapshotRecords(validRecords);
        const intVsExtDistribution = aggregateIntVsExtDistribution(activeSnapshot);
        const clientDistribution = aggregateClientDistribution(activeSnapshot);

        const topClient = clientDistribution[0]?.name || 'Delivery';

        const uploadHistoryItem: UploadHistoryItem = {
          id: `up-${Date.now()}`,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          recordCount: validRecords.length,
          totalRows,
          skippedRows: skippedCount,
          uploadedBy: uploaderName,
          status: 'Completed',
          summarySnippet: {
            topDepartment: topClient
          }
        };

        resolve({
          records: validRecords,
          summary,
          uploadHistoryItem,
          wowTrends,
          intVsExtDistribution,
          clientDistribution,
          validationMetrics: {
            totalRows,
            validCount: validRecords.length,
            skippedCount
          }
        });

      } catch (err: any) {
        console.error("Error parsing excel file:", err);
        reject(new Error(err?.message || "Could not parse Excel file. Please ensure it is a valid .xlsx or .xls file."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read Excel file from disk."));
    };

    reader.readAsArrayBuffer(file);
  });
};

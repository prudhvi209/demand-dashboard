import * as XLSX from 'xlsx';
import { 
  DemandRecord, 
  AnalyticsSummary, 
  UploadHistoryItem,
  FilterState,
  WowTrendPoint,
  IntVsExtDistributionData,
  DepartmentDistributionData
} from '../types';

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

// Convert Excel Serial Date or Date string to clean formatted week string (e.g., 24-Jun-26)
const formatExcelDate = (val: any): string => {
  if (!val) return '24-Jun-26';
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()] || 'Jun';
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  }
  return String(val).trim();
};

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

  // ── Detect the latest snapshot week ──────────────────────────────────────
  const weekOrder = ['24-Jun-26', '01-Jul-26', '08-Jul-26', '16-Jul-26', '22-Jul-26', '29-Jul-26'];
  const weeksInData = new Set(records.map(r => r.week).filter(Boolean) as string[]);

  // Find the latest known week that has data; fall back to last in set
  let latestWeek = '';
  for (let i = weekOrder.length - 1; i >= 0; i--) {
    if (weeksInData.has(weekOrder[i])) {
      latestWeek = weekOrder[i];
      break;
    }
  }
  if (!latestWeek) {
    // Fallback: last unique week by insertion order
    latestWeek = Array.from(weeksInData)[Array.from(weeksInData).length - 1] || '';
  }

  const latestRows = records.filter(r => r.week === latestWeek);

  // ── Cumulative pass (all rows) ────────────────────────────────────────────
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

    const openCount = r.openCount !== undefined ? r.openCount : (r.status === 'Open' || r.status === 'Identified' || r.status === 'Offered' ? pos : 0);
    const closedCount = r.closedCount !== undefined ? r.closedCount : (r.status === 'Filled' || r.status === 'Closed' ? pos : 0);
    const droppedCount = r.droppedCount !== undefined ? r.droppedCount : (r.status === 'Dropped' ? pos : 0);
    const newCount = r.newCount !== undefined ? r.newCount : 0;

    totalOpen += openCount;
    totalClosed += closedCount;
    totalDropped += droppedCount;
    totalNew += newCount;
    if (openCount > 0) openReqCount++;

    if (r.internalExternal?.toLowerCase().includes('internal') || r.status?.toLowerCase().includes('bench')) {
      totalBench += pos;
    }
    if (r.client) clientsSet.add(r.client.trim());
  });

  // ── Latest-snapshot pass — uses Position Status (r.status), NOT weekly event columns ──
  // This is the key semantic fix:
  //   r.openCount  = weekly movement field (0 on 29-Jul → misleading)
  //   r.status     = current position state (Open/Identified/Hold/Dropped/Filled)
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
    const status = (r.status || '').trim();
    latestTotal += pos;

    // Bucket by Position Status — not by openCount/closedCount columns
    if (status === 'Open') {
      latestOpen += pos;
    } else if (status === 'Identified' || status === 'Offered') {
      latestIdentified += pos;
    } else if (status === 'Hold' || status === 'Bench') {
      latestHold += pos;
    } else if (status === 'Dropped') {
      latestDropped += pos;
    } else if (status === 'Filled' || status === 'Closed') {
      latestClosedWeek += pos;
    }

    // Internal vs External: track active demand only (exclude Dropped/Filled/Closed)
    const isActive = status === 'Open' || status === 'Identified' || status === 'Offered'
      || status === 'Hold' || status === 'Bench';
    if (isActive) {
      if (r.internalExternal?.toLowerCase().includes('internal')) {
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

  // Round to 2dp for FTE display
  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    // Legacy (cumulative) — kept for backwards compat
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

    // Latest snapshot (all from Position Status column)
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

  const uniqueWeeks = Array.from(new Set(records.map(r => r.week).filter(Boolean) as string[]));
  const uniqueMonths = Array.from(new Set(records.map(r => r.startMonth).filter(Boolean) as string[]));

  const latestWeek = uniqueWeeks[uniqueWeeks.length - 1];
  const previousWeek = uniqueWeeks.length > 1 ? uniqueWeeks[uniqueWeeks.length - 2] : uniqueWeeks[0];

  const latestMonth = uniqueMonths[uniqueMonths.length - 1];
  const previousMonth = uniqueMonths.length > 1 ? uniqueMonths[uniqueMonths.length - 2] : uniqueMonths[0];

  return records.filter((r) => {
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

    // Custom Date Range
    if (filters.startDate) {
      if (r.dateAdded && r.dateAdded < filters.startDate) return false;
    }
    if (filters.endDate) {
      if (r.dateAdded && r.dateAdded > filters.endDate) return false;
    }

    // Relative Period
    if (filters.period && filters.period !== 'all') {
      switch (filters.period) {
        case 'current_week':
          if (r.week !== latestWeek) return false;
          break;
        case 'last_week':
          if (r.week !== previousWeek) return false;
          break;
        case 'current_month':
          if (r.startMonth !== latestMonth && (!latestMonth || !r.startMonth?.toLowerCase().includes(latestMonth.toLowerCase()))) return false;
          break;
        case 'previous_month':
          if (r.startMonth !== previousMonth && (!previousMonth || !r.startMonth?.toLowerCase().includes(previousMonth.toLowerCase()))) return false;
          break;
      }
    }

    return true;
  });
};

// WOW (Week-over-Week) Weekly Trend Series Aggregator
export const aggregateWowTrends = (records: DemandRecord[]): WowTrendPoint[] => {
  if (!records || records.length === 0) return [];

  const weekMap: Record<string, { total: number; newPos: number; open: number; filled: number; dropped: number }> = {};

  records.forEach((r) => {
    const week = r.week || '24-Jun-26';
    if (!weekMap[week]) {
      weekMap[week] = { total: 0, newPos: 0, open: 0, filled: 0, dropped: 0 };
    }
    const pos = r.requiredCount || 1;
    const open = r.openCount !== undefined ? r.openCount : (r.status === 'Open' || r.status === 'Identified' ? pos : 0);
    const closed = r.closedCount !== undefined ? r.closedCount : (r.status === 'Filled' || r.status === 'Closed' ? pos : 0);
    const dropped = r.droppedCount !== undefined ? r.droppedCount : (r.status === 'Dropped' ? pos : 0);
    const newPos = r.newCount !== undefined ? r.newCount : 0;

    weekMap[week].total += pos;
    weekMap[week].newPos += newPos;
    weekMap[week].open += open;
    weekMap[week].filled += closed;
    weekMap[week].dropped += dropped;
  });

  const weekOrder = ['24-Jun-26', '01-Jul-26', '08-Jul-26', '16-Jul-26', '22-Jul-26', '29-Jul-26'];
  const result: WowTrendPoint[] = [];

  weekOrder.forEach((w) => {
    if (weekMap[w]) {
      result.push({
        week: w,
        totalDemand: Math.round(weekMap[w].total),
        newDemand: Math.round(weekMap[w].newPos),
        openDemand: Math.round(weekMap[w].open),
        filledDemand: Math.round(weekMap[w].filled),
        droppedDemand: Math.round(weekMap[w].dropped)
      });
    }
  });

  if (result.length === 0) {
    Object.entries(weekMap).forEach(([w, val]) => {
      result.push({
        week: w,
        totalDemand: Math.round(val.total),
        newDemand: Math.round(val.newPos),
        openDemand: Math.round(val.open),
        filledDemand: Math.round(val.filled),
        droppedDemand: Math.round(val.dropped)
      });
    });
  }

  return result;
};

// Internal vs External Distribution Aggregator (Position Headcount based)
export const aggregateIntVsExtDistribution = (records: DemandRecord[]): IntVsExtDistributionData[] => {
  if (!records || records.length === 0) return [];

  let internalCount = 0;
  let externalCount = 0;

  records.forEach((r) => {
    const pos = r.requiredCount || 1;
    if (r.internalExternal?.toLowerCase().includes('internal') || r.status?.toLowerCase().includes('bench')) {
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

// Client Position Demand Distribution Aggregator (Top 5 + Others grouping)
export const aggregateClientDistribution = (records: DemandRecord[]): DepartmentDistributionData[] => {
  if (!records || records.length === 0) return [];

  const clientCounts: Record<string, number> = {};

  records.forEach((r) => {
    const client = r.client || r.department || 'Delivery';
    clientCounts[client] = (clientCounts[client] || 0) + (r.requiredCount || 1);
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

// Helper: returns only the records belonging to the latest snapshot week.
// Used by DataContext to feed latest-snapshot data to pie/donut charts.
export const getLatestSnapshotRecords = (records: DemandRecord[]): DemandRecord[] => {
  if (!records || records.length === 0) return [];
  const weekOrder = ['24-Jun-26', '01-Jul-26', '08-Jul-26', '16-Jul-26', '22-Jul-26', '29-Jul-26'];
  const weeksInData = new Set(records.map(r => r.week).filter(Boolean) as string[]);
  let latestWeek = '';
  for (let i = weekOrder.length - 1; i >= 0; i--) {
    if (weeksInData.has(weekOrder[i])) { latestWeek = weekOrder[i]; break; }
  }
  if (!latestWeek) latestWeek = Array.from(weeksInData)[Array.from(weeksInData).length - 1] || '';
  return records.filter(r => r.week === latestWeek);
};

// Returns latest-snapshot rows with Dropped / Filled / Closed excluded.
// Use this to feed charts that should reflect ACTIVE demand only.
export const getActiveSnapshotRecords = (records: DemandRecord[]): DemandRecord[] => {
  const latestRows = getLatestSnapshotRecords(records);
  const inactive = new Set(['Dropped', 'Filled', 'Closed']);
  return latestRows.filter(r => !inactive.has((r.status || '').trim()));
};

export const parseExcelFile = async (file: File, uploaderName: string = 'prudhvi.karri'): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson = XLSX.utils.sheet_to_json<any>(worksheet);

        const totalRows = rawJson.length;
        const validRecords: DemandRecord[] = [];
        let skippedCount = 0;

        rawJson.forEach((row, index) => {
          // Check essential identifier or position fields
          const clientName = row['Client'] || row['Customer'] || row['Opportunity Name'];
          const roleTitle = row['Role'] || row['Position'] || row['Title'] || row['Primary Skill'];
          
          if (!clientName && !roleTitle) {
            skippedCount++;
            return; // Skip invalid row missing required client/role identity
          }

          const posCount = parseFloat(row['Positions'] || row['Total Positions'] || row['Count'] || row['Headcount'] || '1') || 1;
          const openCount = parseFloat(row['Open Positions'] || '0');
          const closedCount = parseFloat(row['Closed Positions'] || '0');
          const droppedCount = parseFloat(row['Dropped Positions'] || '0');
          const newCount = parseFloat(row['New Positions'] || '0');

          const rawProb = parseFloat(row['Oppo Prob']);
          const oppoProb = !isNaN(rawProb) ? rawProb : undefined;

          validRecords.push({
            id: `rec-${1000 + index}`,
            jobId: row['Job ID'] || row['JobID'] || row['Opportunity Name'] || `REQ-${1000 + index}`,
            client: clientName || 'Internal',
            opportunityName: row['Opportunity Name'] || clientName || `Opportunity-${index}`,
            department: row['Department'] || row['Dept'] || 'Delivery',
            position: roleTitle || 'Engineer',
            experienceLevel: row['Experience'] || row['Level'] || 'Senior',
            status: row['Position Status'] || row['Status'] || row['Oppo Stage'] || 'Identified',
            requiredCount: posCount,
            openCount,
            closedCount,
            droppedCount,
            newCount,
            location: row['Location'] || 'Offshore',
            internalExternal: row['Internal / External'] || 'Internal',
            dealOwner: row['Deal Owner'] || row['ED'] || '',
            startMonth: row['Start Month'] || 'Aug-2026',
            dateAdded: row['Start Date'] ? String(row['Start Date']) : new Date().toISOString().split('T')[0],
            oppoType: row['Oppo Type'] ? String(row['Oppo Type']).trim() : undefined,
            oppoProb,
            week: formatExcelDate(row['Week'] || row['Firsttime Fill by Week'])
          });
        });

        if (validRecords.length === 0) {
          throw new Error("No valid demand position rows could be extracted from this spreadsheet.");
        }

        const summary = calculateAnalyticsSummary(validRecords);
        const wowTrends = aggregateWowTrends(validRecords);
        const intVsExtDistribution = aggregateIntVsExtDistribution(validRecords);
        const clientDistribution = aggregateClientDistribution(validRecords);

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

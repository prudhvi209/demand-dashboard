import { DemandRecord } from '../types';
import { parseWeekDate, sortWeeksChronologically } from './dateFilterUtils';
import { isActiveRecord } from './statusUtils';

export interface ClientAgeingSummary {
  client: string;
  activeCount: number;
  avgAgeingWeeks: number;
  maxAgeingWeeks: number;
  avgAgeingDays: number;
  oldestPosition: string;
  oldestJobId?: string;
  firstSeenWeek: string;
  riskLevel: 'healthy' | 'moderate' | 'critical';
  freshCount: number;     // 0-2 wks
  moderateCount: number;  // 2-4 wks
  agingCount: number;     // 4-8 wks
  criticalCount: number;  // >8 wks
}

export interface AgeingMetrics {
  overallAvgWeeks: number;
  overallMaxWeeks: number;
  longestStayingClient: string;
  criticalPositionsCount: number;
  freshPositionsCount: number;
  clientSummaries: ClientAgeingSummary[];
  bucketDistribution: {
    name: string;
    value: number;
    color: string;
    percentage: number;
  }[];
}

/**
 * Calculate ageing metrics per client and overall from demand records.
 * Ageing is calculated based on how many reporting weeks a requisition has been open,
 * or the time span from its first appearance / dateAdded to the reporting date.
 */
export const calculateAgeingMetrics = (records: DemandRecord[]): AgeingMetrics => {
  if (!records || records.length === 0) {
    return {
      overallAvgWeeks: 0,
      overallMaxWeeks: 0,
      longestStayingClient: 'None',
      criticalPositionsCount: 0,
      freshPositionsCount: 0,
      clientSummaries: [],
      bucketDistribution: []
    };
  }

  const allWeeks = sortWeeksChronologically(records.map(r => r.week).filter(Boolean) as string[]);
  const latestSnapshotWeek = allWeeks[allWeeks.length - 1] || '';
  const latestDate = parseWeekDate(latestSnapshotWeek) || new Date();

  // Find the earliest week each opportunity / role was first observed
  const firstSeenMap: Record<string, { firstWeek: string; date: Date | null }> = {};
  
  records.forEach((r) => {
    const key = `${r.client || 'Delivery'}_${r.position || 'Role'}_${r.jobId || r.opportunityName || ''}`.toLowerCase();
    const weekDate = parseWeekDate(r.week || '');
    if (!firstSeenMap[key]) {
      firstSeenMap[key] = { firstWeek: r.week || '', date: weekDate };
    } else if (weekDate && firstSeenMap[key].date && weekDate < firstSeenMap[key].date) {
      firstSeenMap[key] = { firstWeek: r.week || '', date: weekDate };
    }
  });

  // Filter for active positions (strictly excluding Dropped, Filled, Closed)
  const activeRecords = records.filter(r => isActiveRecord(r));

  // Map per client
  const clientMap: Record<string, {
    activePositions: number;
    ageingWeeksList: number[];
    oldestRole: string;
    oldestJobId: string;
    oldestWeek: string;
    maxWeeks: number;
    fresh: number;
    moderate: number;
    aging: number;
    critical: number;
  }> = {};

  let totalAgeingWeeksSum = 0;
  let totalActivePositions = 0;
  let globalMaxWeeks = 0;
  let freshTotal = 0;
  let moderateTotal = 0;
  let agingTotal = 0;
  let criticalTotal = 0;

  activeRecords.forEach((r) => {
    const client = (r.client || r.department || 'Delivery').trim();
    const count = r.requiredCount || 1;
    const key = `${client}_${r.position || 'Role'}_${r.jobId || r.opportunityName || ''}`.toLowerCase();
    
    // Determine start date / first seen week
    const firstSeen = firstSeenMap[key];
    let startD = firstSeen?.date || parseWeekDate(r.week || '');
    if (!startD && r.dateAdded) {
      startD = parseWeekDate(r.dateAdded);
    }
    if (!startD) {
      startD = latestDate;
    }

    // Calculate elapsed weeks (at least 1 week)
    const diffMs = Math.max(0, latestDate.getTime() - startD.getTime());
    const elapsedWeeks = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1);

    if (!clientMap[client]) {
      clientMap[client] = {
        activePositions: 0,
        ageingWeeksList: [],
        oldestRole: r.position || 'Position',
        oldestJobId: r.jobId || '',
        oldestWeek: firstSeen?.firstWeek || r.week || latestSnapshotWeek,
        maxWeeks: 0,
        fresh: 0,
        moderate: 0,
        aging: 0,
        critical: 0
      };
    }

    clientMap[client].activePositions += count;
    for (let i = 0; i < count; i++) {
      clientMap[client].ageingWeeksList.push(elapsedWeeks);
    }

    if (elapsedWeeks > clientMap[client].maxWeeks) {
      clientMap[client].maxWeeks = elapsedWeeks;
      clientMap[client].oldestRole = r.position || 'Position';
      clientMap[client].oldestJobId = r.jobId || '';
      clientMap[client].oldestWeek = firstSeen?.firstWeek || r.week || latestSnapshotWeek;
    }

    if (elapsedWeeks > globalMaxWeeks) {
      globalMaxWeeks = elapsedWeeks;
    }

    // Bucketing
    if (elapsedWeeks <= 2) {
      clientMap[client].fresh += count;
      freshTotal += count;
    } else if (elapsedWeeks <= 4) {
      clientMap[client].moderate += count;
      moderateTotal += count;
    } else if (elapsedWeeks <= 8) {
      clientMap[client].aging += count;
      agingTotal += count;
    } else {
      clientMap[client].critical += count;
      criticalTotal += count;
    }

    totalAgeingWeeksSum += elapsedWeeks * count;
    totalActivePositions += count;
  });

  const clientSummaries: ClientAgeingSummary[] = Object.entries(clientMap).map(([client, data]) => {
    const sumWeeks = data.ageingWeeksList.reduce((a, b) => a + b, 0);
    const avgWeeks = data.ageingWeeksList.length > 0 ? Math.round((sumWeeks / data.ageingWeeksList.length) * 10) / 10 : 0;
    const avgDays = Math.round(avgWeeks * 7);

    let riskLevel: 'healthy' | 'moderate' | 'critical' = 'healthy';
    if (avgWeeks > 5 || data.maxWeeks > 6) {
      riskLevel = 'critical';
    } else if (avgWeeks >= 3 || data.maxWeeks >= 4) {
      riskLevel = 'moderate';
    }

    return {
      client,
      activeCount: Math.round(data.activePositions),
      avgAgeingWeeks: avgWeeks,
      maxAgeingWeeks: data.maxWeeks,
      avgAgeingDays: avgDays,
      oldestPosition: data.oldestRole,
      oldestJobId: data.oldestJobId,
      firstSeenWeek: data.oldestWeek,
      riskLevel,
      freshCount: data.fresh,
      moderateCount: data.moderate,
      agingCount: data.aging,
      criticalCount: data.critical
    };
  }).sort((a, b) => b.avgAgeingWeeks - a.avgAgeingWeeks || b.activeCount - a.activeCount);

  const overallAvgWeeks = totalActivePositions > 0 ? Math.round((totalAgeingWeeksSum / totalActivePositions) * 10) / 10 : 0;
  const longestStayingClient = clientSummaries[0]?.client || 'None';

  const bucketTotal = freshTotal + moderateTotal + agingTotal + criticalTotal;
  const calcPct = (val: number) => bucketTotal > 0 ? Math.round((val / bucketTotal) * 100) : 0;

  const bucketDistribution = [
    { name: '< 2 Weeks (Fresh)', value: Math.round(freshTotal), color: '#10b981', percentage: calcPct(freshTotal) },
    { name: '2 - 4 Weeks (Active)', value: Math.round(moderateTotal), color: '#0ea5e9', percentage: calcPct(moderateTotal) },
    { name: '4 - 6 Weeks (Aging)', value: Math.round(agingTotal), color: '#f59e0b', percentage: calcPct(agingTotal) },
    { name: '> 6 Weeks (Long Stay)', value: Math.round(criticalTotal), color: '#ef4444', percentage: calcPct(criticalTotal) }
  ];

  return {
    overallAvgWeeks,
    overallMaxWeeks: globalMaxWeeks,
    longestStayingClient,
    criticalPositionsCount: Math.round(criticalTotal),
    freshPositionsCount: Math.round(freshTotal),
    clientSummaries,
    bucketDistribution
  };
};

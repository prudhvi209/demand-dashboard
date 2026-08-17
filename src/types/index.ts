export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: string;
  isDemo?: boolean;
}

export interface DemandRecord {
  id?: string;
  jobId: string;
  client: string;
  opportunityName: string;
  department: string;
  position: string;
  experienceLevel?: string;
  status: string; // Open, Identified, Offered, Filled, Closed, Dropped, Hold, Bench
  requiredCount: number;
  openCount: number;
  closedCount: number;
  droppedCount: number;
  newCount: number;
  location: string;
  internalExternal: string;
  dealOwner?: string;
  startMonth: string;
  dateAdded: string;
  oppoType?: string;
  oppoProb?: number;
  week?: string;
}

export interface AnalyticsSummary {
  // --- Legacy fields (kept for filter-panel backward-compat) ---
  currentDemand: number;
  benchEmployees: number;
  openPositions: number;
  closedPositions: number;
  droppedPositions: number;
  newPositions: number;
  totalClients: number;
  totalPositions: number;
  demandPercentage: number;
  fulfillmentRate: number;
  benchPercentage: number;
  lastUpdated: string;

  // --- Latest snapshot fields (computed from the most-recent week only) ---
  /** Total FTE demand in the latest snapshot week */
  latestTotalFTE: number;
  /** Open-status FTE demand in the latest snapshot week */
  latestOpenFTE: number;
  /** Identified-status FTE demand in the latest snapshot week */
  latestIdentifiedFTE: number;
  /** Hold-status FTE demand in the latest snapshot week */
  latestHoldFTE: number;
  /** Open + Identified + Hold = active (non-dropped) demand */
  latestActiveDemandFTE: number;
  /** Dropped-status FTE demand in the latest snapshot week */
  latestDroppedFTE: number;
  /** Closed/Filled FTE count in the latest snapshot week */
  latestClosedThisWeek: number;
  /** Internal active FTE demand in the latest snapshot week (excludes dropped) */
  latestInternalFTE: number;
  /** External active FTE demand in the latest snapshot week (excludes dropped) */
  latestExternalFTE: number;
  /** The week label used for the latest snapshot, e.g. "29-Jul-26" */
  latestSnapshotWeek: string;

  // --- Cumulative fields (explicitly aggregated across all weeks) ---
  /** Sum of closed/filled positions across all snapshot weeks */
  cumulativeClosed: number;
  /** Sum of dropped positions across all snapshot weeks */
  cumulativeDropped: number;
  /** Sum of new positions across all snapshot weeks */
  cumulativeNew: number;
}

export interface UploadHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  recordCount: number; // Total valid records
  totalRows?: number;  // Total rows detected in Excel
  skippedRows?: number; // Invalid/skipped rows
  uploadedBy: string;
  status: 'Completed' | 'Failed' | 'Processing';
  summarySnippet?: {
    topDepartment: string;
    topClient?: string;
  };
}

export type RelativePeriod = 'all' | 'current_week' | 'last_week' | 'current_month' | 'previous_month';

export interface FilterState {
  period: RelativePeriod | null;
  startDate: string | null;
  endDate: string | null;
  department?: string | null;
  client?: string | null;
  status?: string | null;
  ed?: string | null;
  location?: string | null;
}

export interface WowTrendPoint {
  week: string;
  totalDemand: number;
  newDemand: number;
  openDemand: number;
  filledDemand: number;
  droppedDemand: number;
}

export interface IntVsExtDistributionData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface DemandTrendData {
  month: string;
  demand: number;
  fulfilled: number;
}

export interface BenchTrendData {
  month: string;
  bench: number;
  deployed: number;
}

export interface DepartmentDistributionData {
  name: string;
  value: number;
  color: string;
}

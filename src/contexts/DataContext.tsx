import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
import { fetchCurrentDataset, saveParsedDatasetToFirestore, clearLocalStorageDataset } from '../firebase/firestore';
import { 
  parseExcelFile, 
  filterDemandRecords, 
  calculateAnalyticsSummary, 
  aggregateWowTrends, 
  aggregateIntVsExtDistribution,
  aggregateIntVsExtTrend,
  aggregateClientDistribution,
  aggregateLocationDistribution,
  getLatestSnapshotRecords,
  getActiveSnapshotRecords
} from '../utils/excelParser';
import { useAuth } from './AuthContext';

interface DataContextType {
  records: DemandRecord[];
  summary: AnalyticsSummary;
  filteredRecords: DemandRecord[];
  filteredSummary: AnalyticsSummary;
  recentUploads: UploadHistoryItem[];
  wowTrends: WowTrendPoint[];
  /** Week-by-week internal vs external active demand trend */
  intVsExtTrend: IntVsExtTrendPoint[];
  /** Historical (all-week) Int vs Ext distribution — used for context only */
  intVsExtDistribution: IntVsExtDistributionData[];
  /** Latest-snapshot Int vs Ext distribution (all statuses) */
  latestSnapshotIntVsExt: IntVsExtDistributionData[];
  /** Active-demand Int vs Ext distribution (excludes Dropped/Filled) */
  activeSnapshotIntVsExt: IntVsExtDistributionData[];
  clientDistribution: DepartmentDistributionData[];
  /** Latest-snapshot client distribution (all statuses) */
  latestClientDistribution: DepartmentDistributionData[];
  /** Active-demand client distribution (excludes Dropped/Filled) */
  activeClientDistribution: DepartmentDistributionData[];
  activeSnapshotLocation: { name: string; value: number; percentage: number; color: string }[];
  activeSnapshotRecords: DemandRecord[];
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  loading: boolean;
  activeTab: 'dashboard' | 'upload' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'upload' | 'profile') => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  processUploadedFile: (file: File) => Promise<{ success: boolean; message?: string }>;
  refreshData: () => Promise<void>;
  clearData: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const INITIAL_FILTERS: FilterState = {
  period: 'all',
  startDate: null,
  endDate: null,
  department: null,
  client: null,
  status: null,
  ed: null,
  location: null
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<DemandRecord[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
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
  });

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [recentUploads, setRecentUploads] = useState<UploadHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'profile'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCurrentDataset();
      setRecords(data.records);
      setSummary(data.summary);
      setRecentUploads(data.recentUploads);
    } catch (err) {
      console.error("Error loading demand data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reactive Filtered Records
  const filteredRecords = useMemo(() => {
    return filterDemandRecords(records, filters);
  }, [records, filters]);

  // Reactive Filtered Aggregations
  const filteredSummary = useMemo(() => {
    return calculateAnalyticsSummary(filteredRecords);
  }, [filteredRecords]);

  const wowTrends = useMemo(() => {
    return aggregateWowTrends(filteredRecords);
  }, [filteredRecords]);

  const intVsExtTrend = useMemo(() => {
    return aggregateIntVsExtTrend(filteredRecords);
  }, [filteredRecords]);

  const intVsExtDistribution = useMemo(() => {
    return aggregateIntVsExtDistribution(filteredRecords);
  }, [filteredRecords]);

  const clientDistribution = useMemo(() => {
    return aggregateClientDistribution(filteredRecords);
  }, [filteredRecords]);

  // Latest-snapshot distributions — computed from FILTERED records so filters take effect
  const latestSnapshotRecords = useMemo(() => getLatestSnapshotRecords(filteredRecords), [filteredRecords]);
  const activeSnapshotRecords = useMemo(() => getActiveSnapshotRecords(filteredRecords), [filteredRecords]);

  const latestSnapshotIntVsExt = useMemo(() => {
    return aggregateIntVsExtDistribution(latestSnapshotRecords);
  }, [latestSnapshotRecords]);

  const activeSnapshotIntVsExt = useMemo(() => {
    return aggregateIntVsExtDistribution(activeSnapshotRecords);
  }, [activeSnapshotRecords]);

  const latestClientDistribution = useMemo(() => {
    return aggregateClientDistribution(latestSnapshotRecords);
  }, [latestSnapshotRecords]);

  const activeClientDistribution = useMemo(() => {
    return aggregateClientDistribution(activeSnapshotRecords);
  }, [activeSnapshotRecords]);

  const activeSnapshotLocation = useMemo(() => {
    return aggregateLocationDistribution(activeSnapshotRecords);
  }, [activeSnapshotRecords]);

  const processUploadedFile = async (file: File): Promise<{ success: boolean; message?: string }> => {
    try {
      const uploader = user?.displayName || user?.email || 'Analytics Manager';
      const result = await parseExcelFile(file, uploader);

      // Save to Firestore and local storage
      await saveParsedDatasetToFirestore(result.records, result.uploadHistoryItem);

      // Reset active filters & update state
      setFilters(INITIAL_FILTERS);
      setRecords(result.records);
      setSummary(result.summary);
      setRecentUploads((prev) => [result.uploadHistoryItem, ...prev]);

      return { 
        success: true, 
        message: `${result.validationMetrics.totalRows} rows detected. ${result.validationMetrics.validCount} valid records processed successfully.` 
      };
    } catch (err: any) {
      console.error("Process file failed:", err);
      return { success: false, message: err?.message || 'Failed to process Excel spreadsheet' };
    }
  };

  const clearData = () => {
    clearLocalStorageDataset();
    setRecords([]);
    setFilters(INITIAL_FILTERS);
    setRecentUploads([]);
    setSummary({
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
    });
  };

  return (
    <DataContext.Provider
      value={{
        records,
        summary,
        filteredRecords,
        filteredSummary,
        recentUploads,
        wowTrends,
        intVsExtTrend,
        intVsExtDistribution,
        latestSnapshotIntVsExt,
        activeSnapshotIntVsExt,
        clientDistribution,
        latestClientDistribution,
        activeClientDistribution,
        activeSnapshotLocation,
        activeSnapshotRecords,
        filters,
        setFilter,
        resetFilters,
        loading,
        activeTab,
        setActiveTab,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        processUploadedFile,
        refreshData: loadData,
        clearData,
        searchQuery,
        setSearchQuery
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

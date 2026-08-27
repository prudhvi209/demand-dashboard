import { 
  DemandRecord, 
  AnalyticsSummary, 
  UploadHistoryItem,
  WowTrendPoint,
  IntVsExtDistributionData,
  DepartmentDistributionData
} from '../types';
import { 
  calculateAnalyticsSummary,
  aggregateWowTrends,
  aggregateIntVsExtDistribution,
  aggregateClientDistribution
} from '../utils/excelParser';

const LOCAL_STORAGE_KEY_RECORDS = 'agivant_demand_records_v5';
const LOCAL_STORAGE_KEY_UPLOADS = 'agivant_upload_history_v5';

export interface DatasetPayload {
  records: DemandRecord[];
  summary: AnalyticsSummary;
  recentUploads: UploadHistoryItem[];
  wowTrends: WowTrendPoint[];
  intVsExtDistribution: IntVsExtDistributionData[];
  clientDistribution: DepartmentDistributionData[];
}

export const saveParsedDatasetToStorage = async (
  records: DemandRecord[], 
  uploadItem: UploadHistoryItem
): Promise<void> => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(records));
    
    const existingUploadsRaw = localStorage.getItem(LOCAL_STORAGE_KEY_UPLOADS);
    const existingUploads: UploadHistoryItem[] = existingUploadsRaw ? JSON.parse(existingUploadsRaw) : [];
    const updatedUploads = [uploadItem, ...existingUploads];
    localStorage.setItem(LOCAL_STORAGE_KEY_UPLOADS, JSON.stringify(updatedUploads));
  } catch (err) {
    console.warn("Could not save to localStorage:", err);
    throw err;
  }
};

export const fetchCurrentDataset = async (): Promise<DatasetPayload> => {
  try {
    const cachedRecords = localStorage.getItem(LOCAL_STORAGE_KEY_RECORDS);
    const cachedUploads = localStorage.getItem(LOCAL_STORAGE_KEY_UPLOADS);
    if (cachedRecords) {
      const records: DemandRecord[] = JSON.parse(cachedRecords);
      const uploads: UploadHistoryItem[] = cachedUploads ? JSON.parse(cachedUploads) : [];
      if (records && records.length > 0) {
        return {
          records,
          summary: calculateAnalyticsSummary(records),
          recentUploads: uploads,
          wowTrends: aggregateWowTrends(records),
          intVsExtDistribution: aggregateIntVsExtDistribution(records),
          clientDistribution: aggregateClientDistribution(records)
        };
      }
    }
  } catch (e) {
    console.warn("localStorage read error:", e);
  }

  // Default Empty State when no Excel file has been uploaded yet
  return {
    records: [],
    summary: {
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
    },
    recentUploads: [],
    wowTrends: [],
    intVsExtDistribution: [],
    clientDistribution: []
  };
};

export const clearLocalStorageDataset = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_RECORDS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_UPLOADS);
  } catch (e) {
    console.warn("Could not clear localStorage:", e);
  }
};

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
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

export const saveParsedDatasetToFirestore = async (
  records: DemandRecord[], 
  uploadItem: UploadHistoryItem
): Promise<void> => {
  const summary = calculateAnalyticsSummary(records);
  const wowTrends = aggregateWowTrends(records);
  const intVsExtDistribution = aggregateIntVsExtDistribution(records);
  const clientDistribution = aggregateClientDistribution(records);

  // 1. Update localStorage cache for instant UI feedback
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(records));
    
    const existingUploadsRaw = localStorage.getItem(LOCAL_STORAGE_KEY_UPLOADS);
    const existingUploads: UploadHistoryItem[] = existingUploadsRaw ? JSON.parse(existingUploadsRaw) : [];
    const updatedUploads = [uploadItem, ...existingUploads];
    localStorage.setItem(LOCAL_STORAGE_KEY_UPLOADS, JSON.stringify(updatedUploads));
  } catch (err) {
    console.warn("Could not save to localStorage", err);
  }

  // 2. Persist to Firestore database
  if (isFirebaseConfigured) {
    try {
      console.log("Saving dataset to Firestore 'datasets/latest'...", { count: records.length });
      
      const uploadRef = doc(db, 'uploads', uploadItem.id);
      await setDoc(uploadRef, {
        ...uploadItem,
        createdTimestamp: serverTimestamp()
      });

      const datasetRef = doc(db, 'datasets', 'latest');
      await setDoc(datasetRef, {
        records,
        summary,
        wowTrends,
        intVsExtDistribution,
        clientDistribution,
        lastUploadId: uploadItem.id,
        updatedAt: serverTimestamp()
      });
      
      console.log("✅ Firestore dataset successfully persisted to database collection 'datasets/latest'!");
    } catch (err: any) {
      console.error("❌ Firestore Save Error:", err);
      if (err?.code === 'permission-denied') {
        console.error("👉 PERMISSION DENIED: Update Security Rules in Firebase Console to test mode (allow read, write: if true;)");
      }
      throw err;
    }
  }
};

export const fetchCurrentDataset = async (): Promise<DatasetPayload> => {
  // Try reading from Firestore first
  if (isFirebaseConfigured) {
    try {
      console.log("Fetching dataset from Firestore 'datasets/latest'...");
      const datasetRef = doc(db, 'datasets', 'latest');
      const docSnap = await getDoc(datasetRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const records: DemandRecord[] = data.records || [];
        
        // Fetch recent uploads list
        const q = query(collection(db, 'uploads'), orderBy('createdTimestamp', 'desc'), limit(5));
        const uploadsSnap = await getDocs(q);
        const uploads: UploadHistoryItem[] = [];
        uploadsSnap.forEach(u => uploads.push(u.data() as UploadHistoryItem));

        if (records.length > 0) {
          console.log(`✅ Loaded ${records.length} records from Firestore!`);
          return {
            records,
            summary: data.summary || calculateAnalyticsSummary(records),
            recentUploads: uploads,
            wowTrends: data.wowTrends || aggregateWowTrends(records),
            intVsExtDistribution: data.intVsExtDistribution || aggregateIntVsExtDistribution(records),
            clientDistribution: data.clientDistribution || aggregateClientDistribution(records)
          };
        }
      } else {
        console.log("ℹ️ No 'datasets/latest' document found in Firestore yet.");
      }
    } catch (err: any) {
      console.warn("Firestore fetch error:", err);
    }
  }

  // Check localStorage cache
  try {
    const cachedRecords = localStorage.getItem(LOCAL_STORAGE_KEY_RECORDS);
    const cachedUploads = localStorage.getItem(LOCAL_STORAGE_KEY_UPLOADS);
    if (cachedRecords) {
      const records: DemandRecord[] = JSON.parse(cachedRecords);
      const uploads: UploadHistoryItem[] = cachedUploads ? JSON.parse(cachedUploads) : [];
      if (records.length > 0) {
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
    console.warn("localStorage check notice", e);
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

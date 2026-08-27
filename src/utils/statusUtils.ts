import { DemandRecord } from '../types';

/**
 * Normalizes any raw status string and row context into standard domain statuses:
 * 'Open' | 'Identified' | 'Hold' | 'Filled' | 'Dropped'
 */
export const normalizeStatus = (rawStatus?: string, row?: Record<string, any>): string => {
  // Check explicit numeric indicators first if provided
  if (row) {
    const droppedCount = parseFloat(row['Dropped Positions'] || row['Dropped Count'] || row['Dropped'] || '0');
    if (!isNaN(droppedCount) && droppedCount > 0) {
      return 'Dropped';
    }
    const closedCount = parseFloat(row['Closed Positions'] || row['Closed Count'] || row['Filled Positions'] || row['Closed'] || row['Filled'] || '0');
    if (!isNaN(closedCount) && closedCount > 0) {
      return 'Filled';
    }
  }

  const s = (rawStatus || '').trim().toLowerCase();

  if (!s) return 'Open';

  // Dropped / Cancelled / Lost
  if (s.includes('drop') || s.includes('cancel') || s.includes('lost') || s.includes('reject')) {
    return 'Dropped';
  }

  // Filled / Closed / Fulfilled / Joined
  if (s.includes('fill') || s.includes('close') || s.includes('fulfill') || s.includes('join') || s.includes('complete')) {
    return 'Filled';
  }

  // Hold / Paused / Bench
  if (s.includes('hold') || s.includes('pause') || s.includes('bench') || s.includes('freeze')) {
    return 'Hold';
  }

  // Identified / Shortlisted / Offered / Interviewing / Screen
  if (s.includes('ident') || s.includes('offer') || s.includes('shortlist') || s.includes('interview') || s.includes('screen') || s.includes('select')) {
    return 'Identified';
  }

  // Default to Open
  return 'Open';
};

/**
 * Determines whether a demand record is considered an active requirement.
 * Active requirements include Open, Identified, and Hold, but STRICTLY exclude Dropped, Cancelled, and Closed/Filled.
 */
export const isActiveRecord = (r: DemandRecord): boolean => {
  if (!r) return false;

  const s = (r.status || '').trim().toLowerCase();

  // Explicit inactive keywords always win — check FIRST before any count fallback
  if (s.includes('drop') || s.includes('cancel') || s.includes('lost') || s.includes('reject')) {
    return false;
  }
  if (s.includes('fill') || s.includes('close') || s.includes('fulfill') || s.includes('join') || s.includes('complete')) {
    return false;
  }

  // Count-based exclusions (guard after status check to avoid false negatives)
  if (r.droppedCount && r.droppedCount > 0) return false;
  if (r.closedCount && r.closedCount > 0) return false;

  // Explicit active statuses
  if (
    s === 'open' ||
    s === 'active' ||
    s === 'identified' ||
    s === 'offered' ||
    s === 'hold' ||
    s === 'bench' ||
    s.includes('ident') ||
    s.includes('offer') ||
    s.includes('hold')
  ) {
    return true;
  }

  // If status is empty/unknown and no explicit inactive marker, treat as open
  if (!s) return true;

  return false;
};

/**
 * Checks if a demand record is dropped or cancelled
 */
export const isDroppedRecord = (r: DemandRecord): boolean => {
  if (!r) return false;
  if (r.droppedCount && r.droppedCount > 0) return true;
  const s = (r.status || '').trim().toLowerCase();
  return s.includes('drop') || s.includes('cancel') || s.includes('lost') || s.includes('reject');
};

/**
 * Checks if a demand record is filled or closed
 */
export const isFilledRecord = (r: DemandRecord): boolean => {
  if (!r) return false;
  if (r.closedCount && r.closedCount > 0) return true;
  const s = (r.status || '').trim().toLowerCase();
  return s.includes('fill') || s.includes('close') || s.includes('fulfill') || s.includes('join') || s.includes('complete');
};

/**
 * Checks if a record is specifically in Open / Active status (excluding identified/hold/dropped/filled)
 */
export const isOpenRecord = (r: DemandRecord): boolean => {
  if (!isActiveRecord(r)) return false;
  const s = (r.status || '').trim().toLowerCase();
  return s === 'open' || s === 'active' || (!s.includes('ident') && !s.includes('offer') && !s.includes('hold') && !s.includes('bench'));
};

/**
 * Checks if a record is specifically in Identified / Offered status
 */
export const isIdentifiedRecord = (r: DemandRecord): boolean => {
  if (!isActiveRecord(r)) return false;
  const s = (r.status || '').trim().toLowerCase();
  return s === 'identified' || s === 'offered' || s.includes('ident') || s.includes('offer') || (r.identifiedCount !== undefined && r.identifiedCount > 0);
};

/**
 * Checks if a record is specifically in Hold status
 */
export const isHoldRecord = (r: DemandRecord): boolean => {
  if (!isActiveRecord(r)) return false;
  const s = (r.status || '').trim().toLowerCase();
  return s === 'hold' || s === 'bench' || s.includes('hold') || s.includes('pause') || (r.holdCount !== undefined && r.holdCount > 0);
};

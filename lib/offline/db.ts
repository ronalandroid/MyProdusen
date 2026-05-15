import Dexie, { Table } from 'dexie';

// Sync queue operation types
export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncEntity = 'attendance' | 'leave' | 'employee' | 'location' | 'shift';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

// Sync queue item
export interface SyncQueueItem {
  id?: number;
  clientId: string; // Unique client-generated ID
  operation: SyncOperation;
  entity: SyncEntity;
  entityId?: string; // Server ID (if exists)
  data: any;
  timestamp: number;
  status: SyncStatus;
  retries: number;
  lastError?: string;
  serverTimestamp?: number; // For conflict detection
}

// Offline attendance record
export interface OfflineAttendance {
  id?: number;
  clientId: string;
  employeeId: string;
  type: 'check-in' | 'check-out';
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  selfieDataUrl: string;
  locationId?: string;
  shiftId?: string;
  notes?: string;
  synced: boolean;
  serverId?: string;
}

// Offline leave request
export interface OfflineLeave {
  id?: number;
  clientId: string;
  employeeId: string;
  type: 'sick' | 'annual' | 'permission';
  startDate: string;
  endDate: string;
  reason: string;
  timestamp: number;
  synced: boolean;
  serverId?: string;
}

// Cached employee data
export interface CachedEmployee {
  id: string;
  nip: string;
  name: string;
  email: string;
  divisionId?: string;
  positionId?: string;
  locationId?: string;
  shiftId?: string;
  photoUrl?: string;
  cachedAt: number;
}

// Cached work location
export interface CachedLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  cachedAt: number;
}

// Cached shift
export interface CachedShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  cachedAt: number;
}

// Sync conflict
export interface SyncConflict {
  id?: number;
  queueItemId: number;
  entity: SyncEntity;
  entityId: string;
  clientData: any;
  serverData: any;
  clientTimestamp: number;
  serverTimestamp: number;
  resolvedAt?: number;
  resolution?: 'client' | 'server' | 'manual';
}

// Dexie database class
export class OfflineDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem, number>;
  offlineAttendance!: Table<OfflineAttendance, number>;
  offlineLeave!: Table<OfflineLeave, number>;
  cachedEmployees!: Table<CachedEmployee, string>;
  cachedLocations!: Table<CachedLocation, string>;
  cachedShifts!: Table<CachedShift, string>;
  conflicts!: Table<SyncConflict, number>;

  constructor() {
    super('MyProdusenOfflineDB');
    
    this.version(1).stores({
      syncQueue: '++id, clientId, status, entity, timestamp',
      offlineAttendance: '++id, clientId, employeeId, synced, timestamp',
      offlineLeave: '++id, clientId, employeeId, synced, timestamp',
      cachedEmployees: 'id, nip, locationId, shiftId, cachedAt',
      cachedLocations: 'id, cachedAt',
      cachedShifts: 'id, cachedAt',
      conflicts: '++id, queueItemId, entity, resolvedAt'
    });
  }
}

// Singleton instance
export const offlineDb = new OfflineDatabase();

// Helper to generate client IDs
export function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to check storage quota
export async function checkStorageQuota(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;
    return { usage, quota, percentage };
  }
  return { usage: 0, quota: 0, percentage: 0 };
}

// Helper to clean old synced records
export async function cleanOldRecords(daysToKeep: number = 7): Promise<void> {
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  // Clean synced attendance
  await offlineDb.offlineAttendance
    .where('synced').equals(1)
    .and(item => item.timestamp < cutoffTime)
    .delete();
  
  // Clean synced leave
  await offlineDb.offlineLeave
    .where('synced').equals(1)
    .and(item => item.timestamp < cutoffTime)
    .delete();
  
  // Clean synced queue items
  await offlineDb.syncQueue
    .where('status').equals('synced')
    .and(item => item.timestamp < cutoffTime)
    .delete();
  
  // Clean old cache (>7 days)
  await offlineDb.cachedEmployees
    .where('cachedAt').below(cutoffTime)
    .delete();
  
  await offlineDb.cachedLocations
    .where('cachedAt').below(cutoffTime)
    .delete();
  
  await offlineDb.cachedShifts
    .where('cachedAt').below(cutoffTime)
    .delete();
}

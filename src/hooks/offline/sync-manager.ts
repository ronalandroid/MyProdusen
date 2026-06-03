import { offlineDb, SyncQueueItem, SyncStatus, generateClientId } from './db';
import { networkDetector } from './network-detector';
import { conflictResolver } from './conflict-resolver';

export type SyncEventType = 'sync-start' | 'sync-progress' | 'sync-complete' | 'sync-error';

export interface SyncEvent {
  type: SyncEventType;
  total: number;
  synced: number;
  failed: number;
  pending: number;
  error?: string;
}

type SyncEventListener = (event: SyncEvent) => void;

/**
 * Built request payload for a queued sync item.
 * Attendance create operations are sent as multipart/form-data with a
 * realtime selfie File (the server endpoints parse request.formData() and
 * reject JSON), everything else stays JSON.
 */
export interface SyncRequestPayload {
  body: BodyInit;
  /**
   * Extra headers to merge onto the base sync headers. For FormData the
   * Content-Type MUST be omitted so the browser/runtime sets the multipart
   * boundary automatically.
   */
  headers: Record<string, string>;
}

/**
 * Convert a data URL (e.g. "data:image/jpeg;base64,....") into a File.
 * Returns null when the value is not a parseable data URL.
 */
export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  if (typeof dataUrl !== 'string') return null;
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;

  const mime = match[1] || 'application/octet-stream';
  const isBase64 = !!match[2];
  const rawData = match[3] || '';

  const source = isBase64 ? atob(rawData) : decodeURIComponent(rawData);
  const buffer = new ArrayBuffer(source.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < source.length; i++) {
    bytes[i] = source.charCodeAt(i);
  }

  return new File([buffer], filename, { type: mime });
}

/**
 * Build the outgoing request payload for a queued attendance create item.
 * Produces FormData matching the server contract:
 *   - selfie (File, required)
 *   - workLocationId, shiftId, latitude, longitude, accuracy,
 *     deviceInfo, gpsTimestamp
 * The stored offline record uses different field names (locationId,
 * selfieDataUrl, timestamp), so this remaps them.
 */
export function buildAttendanceFormData(data: any): FormData {
  const form = new FormData();

  const selfie = dataUrlToFile(data?.selfieDataUrl, 'selfie.jpg');
  if (selfie) {
    form.append('selfie', selfie);
  }

  if (data?.locationId != null) form.append('workLocationId', String(data.locationId));
  if (data?.shiftId != null) form.append('shiftId', String(data.shiftId));
  if (data?.latitude != null) form.append('latitude', String(data.latitude));
  if (data?.longitude != null) form.append('longitude', String(data.longitude));
  if (data?.accuracy != null) form.append('accuracy', String(data.accuracy));
  if (data?.deviceInfo != null) form.append('deviceInfo', String(data.deviceInfo));
  if (data?.note != null) form.append('note', String(data.note));
  if (data?.notes != null) form.append('note', String(data.notes));
  if (data?.timestamp != null) {
    form.append('gpsTimestamp', new Date(data.timestamp).toISOString());
  }

  return form;
}

export class SyncManager {
  private listeners: Set<SyncEventListener> = new Set();
  private isSyncing: boolean = false;
  private syncInterval?: NodeJS.Timeout;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // Base delay in ms
  private maxQueueSize: number = 1000;

  constructor() {
    // Subscribe to network changes
    networkDetector.subscribe((isOnline) => {
      if (isOnline && !this.isSyncing) {
        // Auto-sync when coming back online
        this.syncAll();
      }
    });

    // Periodic sync every 5 minutes when online
    if (typeof window !== 'undefined') {
      this.syncInterval = setInterval(() => {
        if (networkDetector.isOnline && !this.isSyncing) {
          this.syncAll();
        }
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Add an operation to the sync queue
   */
  public async addToQueue(item: Omit<SyncQueueItem, 'id' | 'status' | 'retries' | 'timestamp'>): Promise<number> {
    // Check queue size limit
    const queueSize = await offlineDb.syncQueue.count();
    if (queueSize >= this.maxQueueSize) {
      throw new Error('Sync queue is full. Please sync or clear old items.');
    }

    const queueItem: SyncQueueItem = {
      ...item,
      clientId: item.clientId || generateClientId(),
      timestamp: Date.now(),
      status: 'pending',
      retries: 0
    };

    const id = await offlineDb.syncQueue.add(queueItem);

    // Try immediate sync if online
    if (networkDetector.isOnline && !this.isSyncing) {
      this.syncAll();
    }

    return id;
  }

  /**
   * Sync all pending items in the queue
   */
  public async syncAll(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!networkDetector.isOnline) {
      console.log('Cannot sync: offline');
      return;
    }

    this.isSyncing = true;

    try {
      const pendingItems = await offlineDb.syncQueue
        .where('status')
        .anyOf(['pending', 'failed'])
        .toArray();

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        return;
      }

      this.notifyListeners({
        type: 'sync-start',
        total: pendingItems.length,
        synced: 0,
        failed: 0,
        pending: pendingItems.length
      });

      let synced = 0;
      let failed = 0;

      // Process items in batches of 10
      const batchSize = 10;
      for (let i = 0; i < pendingItems.length; i += batchSize) {
        const batch = pendingItems.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (item) => {
            try {
              await this.syncItem(item);
              synced++;
            } catch (error) {
              failed++;
              console.error(`Failed to sync item ${item.id}:`, error);
            }
          })
        );

        // Notify progress
        this.notifyListeners({
          type: 'sync-progress',
          total: pendingItems.length,
          synced,
          failed,
          pending: pendingItems.length - synced - failed
        });
      }

      this.notifyListeners({
        type: 'sync-complete',
        total: pendingItems.length,
        synced,
        failed,
        pending: 0
      });

    } catch (error) {
      this.notifyListeners({
        type: 'sync-error',
        total: 0,
        synced: 0,
        failed: 0,
        pending: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single queue item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    if (!item.id) return;

    // Update status to syncing
    await offlineDb.syncQueue.update(item.id, { status: 'syncing' });

    try {
      let response: Response;
      const baseHeaders: Record<string, string> = {
        'X-Sync-Timestamp': item.timestamp.toString(),
        'X-Client-ID': item.clientId
      };

      // Build API endpoint and method based on operation
      const endpoint = this.getEndpoint(item);
      const method = this.getMethod(item.operation);

      if (item.operation === 'delete') {
        response = await fetch(endpoint, {
          method,
          headers: baseHeaders,
          credentials: 'include' // Use httpOnly cookie for auth
        });
      } else {
        const payload = this.buildRequestPayload(item);
        response = await fetch(endpoint, {
          method,
          headers: { ...baseHeaders, ...payload.headers },
          credentials: 'include', // Use httpOnly cookie for auth
          body: payload.body
        });
      }

      // Handle conflict (409)
      if (response.status === 409) {
        const serverData = await response.json();
        
        // Store conflict for resolution
        await offlineDb.conflicts.add({
          entity: item.entity,
          queueItemId: item.id!,
          entityId: item.entityId || '',
          clientData: item.data,
          serverData: serverData.data || serverData,
          clientTimestamp: item.timestamp,
          serverTimestamp: serverData.timestamp || Date.now(),
        });

        // Try auto-resolve
        const resolution = await conflictResolver.resolveConflict(
          item, 
          serverData.data || serverData, 
          serverData.timestamp || Date.now()
        );

        if (resolution.strategy === 'server-wins') {
          // Accept server data, mark as synced
          await offlineDb.syncQueue.update(item.id, { 
            status: 'synced',
            lastError: 'Conflict resolved: server data accepted'
          });
        } else if (resolution.strategy === 'client-wins') {
          // Retry with force flag
          await offlineDb.syncQueue.update(item.id, {
            status: 'pending',
            retries: 0
          });
        } else {
          // Mark as synced (server data accepted)
          await offlineDb.syncQueue.update(item.id, { status: 'synced' });
        }
        return;
      }

      // Handle other errors
      if (!response.ok) {
        // Check if it's an auth error
        if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Update local record with server ID if it's a create operation
      if (item.operation === 'create' && result.id) {
        await this.updateLocalRecord(item, result.id);
      }

      // Mark as synced
      await offlineDb.syncQueue.update(item.id, { 
        status: 'synced',
        entityId: result.id || item.entityId
      });

    } catch (error) {
      const retries = item.retries + 1;
      const lastError = error instanceof Error ? error.message : 'Unknown error';

      if (retries >= this.maxRetries) {
        // Max retries reached, mark as failed
        await offlineDb.syncQueue.update(item.id, {
          status: 'failed',
          retries,
          lastError
        });
      } else {
        // Retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        await offlineDb.syncQueue.update(item.id, {
          status: 'pending',
          retries,
          lastError
        });
      }

      throw error;
    }
  }

  /**
   * Build the request body + content headers for a non-delete sync item.
   * Attendance create operations must be multipart/form-data with a selfie
   * File (the server parses request.formData() and validates a selfie file +
   * flat fields), so JSON would always be rejected. Everything else is JSON.
   */
  private buildRequestPayload(item: SyncQueueItem): SyncRequestPayload {
    if (item.entity === 'attendance' && item.operation === 'create') {
      // FormData: do NOT set Content-Type — the runtime sets the multipart
      // boundary header automatically.
      return {
        body: buildAttendanceFormData(item.data),
        headers: {}
      };
    }

    return {
      body: JSON.stringify(item.data),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  /**
   * Get API endpoint for sync item
   */
  private getEndpoint(item: SyncQueueItem): string {
    const base = '/api';
    
    switch (item.entity) {
      case 'attendance':
        if (item.operation === 'create') {
          return item.data.type === 'check-in' 
            ? `${base}/attendance/check-in`
            : `${base}/attendance/check-out`;
        }
        return `${base}/attendance/${item.entityId}`;
      
      case 'leave':
        return item.operation === 'create'
          ? `${base}/leave`
          : `${base}/leave/${item.entityId}`;
      
      case 'employee':
        return item.operation === 'create'
          ? `${base}/employees`
          : `${base}/employees/${item.entityId}`;
      
      default:
        throw new Error(`Unknown entity: ${item.entity}`);
    }
  }

  /**
   * Get HTTP method for operation
   */
  private getMethod(operation: string): string {
    switch (operation) {
      case 'create': return 'POST';
      case 'update': return 'PATCH';
      case 'delete': return 'DELETE';
      default: return 'POST';
    }
  }

  /**
   * Update local record with server ID
   */
  private async updateLocalRecord(item: SyncQueueItem, serverId: string): Promise<void> {
    switch (item.entity) {
      case 'attendance':
        await offlineDb.offlineAttendance
          .where('clientId').equals(item.clientId)
          .modify({ serverId, synced: true });
        break;
      
      case 'leave':
        await offlineDb.offlineLeave
          .where('clientId').equals(item.clientId)
          .modify({ serverId, synced: true });
        break;
    }
  }

  /**
   * Get sync status
   */
  public async getStatus(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    conflicts: number;
  }> {
    const [pending, syncing, failed, conflicts] = await Promise.all([
      offlineDb.syncQueue.where('status').equals('pending').count(),
      offlineDb.syncQueue.where('status').equals('syncing').count(),
      offlineDb.syncQueue.where('status').equals('failed').count(),
      offlineDb.conflicts.where('resolvedAt').equals(undefined as any).count()
    ]);

    return { pending, syncing, failed, conflicts };
  }

  /**
   * Clear synced items from queue
   */
  public async clearSynced(): Promise<void> {
    await offlineDb.syncQueue.where('status').equals('synced').delete();
  }

  /**
   * Retry failed items
   */
  public async retryFailed(): Promise<void> {
    await offlineDb.syncQueue
      .where('status').equals('failed')
      .modify({ status: 'pending', retries: 0 });
    
    if (networkDetector.isOnline) {
      await this.syncAll();
    }
  }

  /**
   * Subscribe to sync events
   */
  public subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(event: SyncEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync event listener:', error);
      }
    });
  }

  /**
   * Destroy sync manager
   */
  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const syncManager = new SyncManager();

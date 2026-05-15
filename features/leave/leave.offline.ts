import { offlineDb, generateClientId, OfflineLeave } from '@/lib/offline/db';
import { syncManager } from '@/lib/offline/sync-manager';
import { networkDetector } from '@/lib/offline/network-detector';

export interface OfflineLeaveRequestData {
  employeeId: string;
  type: 'sick' | 'annual' | 'permission';
  startDate: string;
  endDate: string;
  reason: string;
}

export class OfflineLeaveService {
  /**
   * Create leave request offline
   */
  async createLeaveRequest(data: OfflineLeaveRequestData): Promise<{ clientId: string; offline: boolean }> {
    const clientId = generateClientId();
    const timestamp = Date.now();

    // Store in offline leave table
    const offlineRecord: OfflineLeave = {
      clientId,
      employeeId: data.employeeId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      timestamp,
      synced: false
    };

    await offlineDb.offlineLeave.add(offlineRecord);

    // Add to sync queue
    await syncManager.addToQueue({
      clientId,
      operation: 'create',
      entity: 'leave',
      data: {
        employeeId: data.employeeId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        timestamp
      }
    });

    return {
      clientId,
      offline: !networkDetector.isOnline
    };
  }

  /**
   * Get all pending (unsynced) leave requests
   */
  async getPendingRequests(employeeId?: string): Promise<OfflineLeave[]> {
    const records = await offlineDb.offlineLeave
      .where('synced')
      .equals(0 as any)
      .toArray();
    
    if (employeeId) {
      return records.filter(r => r.employeeId === employeeId);
    }
    
    return records;
  }

  /**
   * Get leave request history
   */
  async getHistory(employeeId: string, days: number = 90): Promise<OfflineLeave[]> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    return await offlineDb.offlineLeave
      .where('employeeId')
      .equals(employeeId)
      .and(record => record.timestamp >= cutoff)
      .reverse()
      .sortBy('timestamp');
  }

  /**
   * Delete old synced records
   */
  async cleanOldRecords(daysToKeep: number = 30): Promise<void> {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    await offlineDb.offlineLeave
      .where('synced')
      .equals(1 as any)
      .and(record => record.timestamp < cutoff)
      .delete();
  }

  /**
   * Validate leave request dates
   */
  validateDates(startDate: string, endDate: string): { valid: boolean; message?: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return {
        valid: false,
        message: 'Start date cannot be in the past'
      };
    }

    if (end < start) {
      return {
        valid: false,
        message: 'End date cannot be before start date'
      };
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
      return {
        valid: false,
        message: 'Leave duration cannot exceed 30 days'
      };
    }

    return { valid: true };
  }

  /**
   * Calculate leave duration in days
   */
  calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
}

// Singleton instance
export const offlineLeaveService = new OfflineLeaveService();

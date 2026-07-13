import { offlineDb, generateClientId, OfflineAttendance } from '@/hooks/offline/db';
import { syncManager } from '@/hooks/offline/sync-manager';
import { networkDetector } from '@/hooks/offline/network-detector';

export interface OfflineCheckInData {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  selfieDataUrl: string;
  locationId?: string;
  shiftId?: string;
  notes?: string;
  manualReason?: string;
  deviceInfo?: string;
  /**
   * Stable idempotency key. Pass the SAME key the online submit used so the
   * server dedups the two attempts (see sync-manager Idempotency-Key). Defaults
   * to a fresh clientId when omitted.
   */
  clientId?: string;
}

export interface OfflineCheckOutData {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  selfieDataUrl: string;
  notes?: string;
  manualReason?: string;
  lateReason?: string;
  deviceInfo?: string;
  clientId?: string;
}

export class OfflineAttendanceService {
  /**
   * Check-in offline
   */
  async checkIn(data: OfflineCheckInData): Promise<{ clientId: string; offline: boolean }> {
    const clientId = data.clientId || generateClientId();
    const timestamp = Date.now();

    // Store in offline attendance table
    const offlineRecord: OfflineAttendance = {
      clientId,
      employeeId: data.employeeId,
      type: 'check-in',
      timestamp,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      selfieDataUrl: data.selfieDataUrl,
      locationId: data.locationId,
      shiftId: data.shiftId,
      notes: data.notes,
      synced: false
    };

    await offlineDb.offlineAttendance.add(offlineRecord);

    // Add to sync queue
    await syncManager.addToQueue({
      clientId,
      operation: 'create',
      entity: 'attendance',
      data: {
        type: 'check-in',
        employeeId: data.employeeId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        selfieDataUrl: data.selfieDataUrl,
        locationId: data.locationId,
        shiftId: data.shiftId,
        notes: data.notes,
        manualReason: data.manualReason,
        deviceInfo: data.deviceInfo,
        timestamp
      }
    });

    return {
      clientId,
      offline: !networkDetector.isOnline
    };
  }

  /**
   * Check-out offline
   */
  async checkOut(data: OfflineCheckOutData): Promise<{ clientId: string; offline: boolean }> {
    const clientId = data.clientId || generateClientId();
    const timestamp = Date.now();

    // Store in offline attendance table
    const offlineRecord: OfflineAttendance = {
      clientId,
      employeeId: data.employeeId,
      type: 'check-out',
      timestamp,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      selfieDataUrl: data.selfieDataUrl,
      notes: data.notes,
      synced: false
    };

    await offlineDb.offlineAttendance.add(offlineRecord);

    // Add to sync queue
    await syncManager.addToQueue({
      clientId,
      operation: 'create',
      entity: 'attendance',
      data: {
        type: 'check-out',
        employeeId: data.employeeId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        selfieDataUrl: data.selfieDataUrl,
        notes: data.notes,
        manualReason: data.manualReason,
        lateReason: data.lateReason,
        deviceInfo: data.deviceInfo,
        timestamp
      }
    });

    return {
      clientId,
      offline: !networkDetector.isOnline
    };
  }

  /**
   * Get today's attendance (including offline records)
   */
  async getTodayAttendance(employeeId: string): Promise<{
    checkIn?: OfflineAttendance;
    checkOut?: OfflineAttendance;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const records = await offlineDb.offlineAttendance
      .where('employeeId')
      .equals(employeeId)
      .and(record => record.timestamp >= todayTimestamp)
      .toArray();

    const checkIn = records.find(r => r.type === 'check-in');
    const checkOut = records.find(r => r.type === 'check-out');

    return { checkIn, checkOut };
  }

  /**
   * Get all pending (unsynced) attendance records
   */
  async getPendingRecords(employeeId?: string): Promise<OfflineAttendance[]> {
    const records = await offlineDb.offlineAttendance
      .where('synced')
      .equals(0 as any)
      .toArray();
    
    if (employeeId) {
      return records.filter(r => r.employeeId === employeeId);
    }
    
    return records;
  }

  /**
   * Get attendance history (last 30 days)
   */
  async getHistory(employeeId: string, days: number = 30): Promise<OfflineAttendance[]> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    return await offlineDb.offlineAttendance
      .where('employeeId')
      .equals(employeeId)
      .and(record => record.timestamp >= cutoff)
      .reverse()
      .sortBy('timestamp');
  }

  /**
   * Delete old synced records
   */
  async cleanOldRecords(daysToKeep: number = 7): Promise<void> {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    await offlineDb.offlineAttendance
      .where('synced')
      .equals(1 as any)
      .and(record => record.timestamp < cutoff)
      .delete();
  }

  /**
   * Compress selfie image for storage
   */
  async compressSelfie(dataUrl: string, maxSizeKB: number = 500): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions (max 800px width)
        const maxWidth = 800;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to meet size requirement
        let quality = 0.8;
        let compressed = canvas.toDataURL('image/jpeg', quality);
        
        while (compressed.length > maxSizeKB * 1024 && quality > 0.1) {
          quality -= 0.1;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(compressed);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = dataUrl;
    });
  }

  /**
   * Validate GPS accuracy
   */
  validateGPSAccuracy(accuracy: number): { valid: boolean; message?: string } {
    if (accuracy > 100) {
      return {
        valid: false,
        message: 'GPS accuracy too low. Please ensure GPS is enabled and try again.'
      };
    }
    
    if (accuracy > 50) {
      return {
        valid: true,
        message: 'GPS accuracy is moderate. Consider moving to an open area for better accuracy.'
      };
    }
    
    return { valid: true };
  }

  /**
   * Check if employee has already checked in today
   */
  async hasCheckedInToday(employeeId: string): Promise<boolean> {
    const { checkIn } = await this.getTodayAttendance(employeeId);
    return !!checkIn;
  }

  /**
   * Check if employee has already checked out today
   */
  async hasCheckedOutToday(employeeId: string): Promise<boolean> {
    const { checkOut } = await this.getTodayAttendance(employeeId);
    return !!checkOut;
  }
}

// Singleton instance
export const offlineAttendanceService = new OfflineAttendanceService();

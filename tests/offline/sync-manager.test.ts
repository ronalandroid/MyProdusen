import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineDb, generateClientId } from '@/hooks/offline/db';

describe('Offline Sync Manager', () => {
  beforeEach(async () => {
    // Clear database before each test
    await offlineDb.syncQueue.clear();
    await offlineDb.offlineAttendance.clear();
  });

  describe('generateClientId', () => {
    it('should generate unique client IDs', () => {
      const id1 = generateClientId();
      const id2 = generateClientId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with timestamp and random parts', () => {
      const id = generateClientId();
      const parts = id.split('-');
      
      expect(parts.length).toBe(2);
      expect(parseInt(parts[0])).toBeGreaterThan(0);
    });
  });

  describe('Sync Queue', () => {
    it('should add item to sync queue', async () => {
      const clientId = generateClientId();
      
      await offlineDb.syncQueue.add({
        clientId,
        operation: 'create',
        entity: 'attendance',
        data: { test: 'data' },
        timestamp: Date.now(),
        status: 'pending',
        retries: 0
      });

      const items = await offlineDb.syncQueue.toArray();
      expect(items.length).toBe(1);
      expect(items[0].clientId).toBe(clientId);
    });

    it('should retrieve pending items', async () => {
      await offlineDb.syncQueue.bulkAdd([
        {
          clientId: generateClientId(),
          operation: 'create',
          entity: 'attendance',
          data: {},
          timestamp: Date.now(),
          status: 'pending',
          retries: 0
        },
        {
          clientId: generateClientId(),
          operation: 'create',
          entity: 'leave',
          data: {},
          timestamp: Date.now(),
          status: 'synced',
          retries: 0
        }
      ]);

      const pending = await offlineDb.syncQueue
        .where('status')
        .equals('pending')
        .toArray();

      expect(pending.length).toBe(1);
      expect(pending[0].status).toBe('pending');
    });

    it('should update item status', async () => {
      const id = await offlineDb.syncQueue.add({
        clientId: generateClientId(),
        operation: 'create',
        entity: 'attendance',
        data: {},
        timestamp: Date.now(),
        status: 'pending',
        retries: 0
      });

      await offlineDb.syncQueue.update(id, { status: 'synced' });

      const item = await offlineDb.syncQueue.get(id);
      expect(item?.status).toBe('synced');
    });
  });

  describe('Offline Attendance', () => {
    it('should store offline attendance record', async () => {
      const clientId = generateClientId();
      
      await offlineDb.offlineAttendance.add({
        clientId,
        employeeId: 'emp_123',
        type: 'check-in',
        timestamp: Date.now(),
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 10,
        selfieDataUrl: 'data:image/jpeg;base64,test',
        synced: false
      });

      const records = await offlineDb.offlineAttendance.toArray();
      expect(records.length).toBe(1);
      expect(records[0].employeeId).toBe('emp_123');
    });

    it('should retrieve unsynced attendance records', async () => {
      await offlineDb.offlineAttendance.bulkAdd([
        {
          clientId: generateClientId(),
          employeeId: 'emp_123',
          type: 'check-in',
          timestamp: Date.now(),
          latitude: 0,
          longitude: 0,
          accuracy: 10,
          selfieDataUrl: 'test',
          synced: false
        },
        {
          clientId: generateClientId(),
          employeeId: 'emp_123',
          type: 'check-out',
          timestamp: Date.now(),
          latitude: 0,
          longitude: 0,
          accuracy: 10,
          selfieDataUrl: 'test',
          synced: true
        }
      ]);

      const unsynced = await offlineDb.offlineAttendance
        .filter(item => item.synced === false)
        .toArray();

      expect(unsynced.length).toBe(1);
      expect(unsynced[0].type).toBe('check-in');
    });
  });

  describe('Storage Cleanup', () => {
    it('should delete old synced records', async () => {
      const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
      const recentTimestamp = Date.now() - (6 * 24 * 60 * 60 * 1000); // 6 days ago

      await offlineDb.offlineAttendance.bulkAdd([
        {
          clientId: generateClientId(),
          employeeId: 'emp_123',
          type: 'check-in',
          timestamp: oldTimestamp,
          latitude: 0,
          longitude: 0,
          accuracy: 10,
          selfieDataUrl: 'test',
          synced: true
        },
        {
          clientId: generateClientId(),
          employeeId: 'emp_123',
          type: 'check-in',
          timestamp: recentTimestamp,
          latitude: 0,
          longitude: 0,
          accuracy: 10,
          selfieDataUrl: 'test',
          synced: true
        }
      ]);

      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
      await offlineDb.offlineAttendance
        .filter(item => item.synced === true && item.timestamp < cutoff)
        .delete();

      const remaining = await offlineDb.offlineAttendance.toArray();
      expect(remaining.length).toBe(1);
      expect(remaining[0].timestamp).toBe(recentTimestamp);
    });
  });
});

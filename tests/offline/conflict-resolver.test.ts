import { describe, it, expect, beforeEach } from 'vitest';
import { conflictResolver } from '@/lib/offline/conflict-resolver';

describe('Conflict Resolver', () => {
  describe('detectConflict', () => {
    it('should detect conflict when server timestamp is newer', () => {
      const clientTimestamp = 1000;
      const serverTimestamp = 2000;
      const clientData = { value: 'client' };
      const serverData = { value: 'server' };

      const hasConflict = conflictResolver.detectConflict(
        clientTimestamp,
        serverTimestamp,
        clientData,
        serverData
      );

      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict when data is identical', () => {
      const clientTimestamp = 1000;
      const serverTimestamp = 2000;
      const data = { value: 'same' };

      const hasConflict = conflictResolver.detectConflict(
        clientTimestamp,
        serverTimestamp,
        data,
        data
      );

      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict when client is newer', () => {
      const clientTimestamp = 2000;
      const serverTimestamp = 1000;
      const clientData = { value: 'client' };
      const serverData = { value: 'server' };

      const hasConflict = conflictResolver.detectConflict(
        clientTimestamp,
        serverTimestamp,
        clientData,
        serverData
      );

      expect(hasConflict).toBe(false);
    });
  });

  describe('getStrategyForEntity', () => {
    it('should return last-write-wins for attendance', () => {
      const strategy = conflictResolver.getStrategyForEntity('attendance');
      expect(strategy).toBe('last-write-wins');
    });

    it('should return server-wins for leave', () => {
      const strategy = conflictResolver.getStrategyForEntity('leave');
      expect(strategy).toBe('server-wins');
    });

    it('should return server-wins for employee', () => {
      const strategy = conflictResolver.getStrategyForEntity('employee');
      expect(strategy).toBe('server-wins');
    });

    it('should return last-write-wins for unknown entity', () => {
      const strategy = conflictResolver.getStrategyForEntity('unknown');
      expect(strategy).toBe('last-write-wins');
    });
  });

  describe('mergeData', () => {
    it('should merge data with server preference by default', () => {
      const clientData = { field1: 'client1', field2: 'client2' };
      const serverData = { field1: 'server1', field2: 'server2' };

      const merged = conflictResolver.mergeData(clientData, serverData);

      expect(merged.field1).toBe('server1');
      expect(merged.field2).toBe('server2');
    });

    it('should prefer client data for specified fields', () => {
      const clientData = { field1: 'client1', field2: 'client2' };
      const serverData = { field1: 'server1', field2: 'server2' };

      const merged = conflictResolver.mergeData(
        clientData,
        serverData,
        ['field1']
      );

      expect(merged.field1).toBe('client1');
      expect(merged.field2).toBe('server2');
    });

    it('should handle undefined client fields', () => {
      const clientData = { field1: 'client1' };
      const serverData = { field1: 'server1', field2: 'server2' };

      const merged = conflictResolver.mergeData(
        clientData,
        serverData,
        ['field1', 'field2']
      );

      expect(merged.field1).toBe('client1');
      expect(merged.field2).toBe('server2');
    });
  });
});

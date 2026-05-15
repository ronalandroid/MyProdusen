import { offlineDb, SyncConflict, SyncQueueItem } from './db';

export type ConflictResolutionStrategy = 'last-write-wins' | 'server-wins' | 'client-wins' | 'manual';

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  resolvedData: any;
  shouldRetry: boolean;
}

export class ConflictResolver {
  /**
   * Detect if there's a conflict between client and server data
   */
  public detectConflict(
    clientTimestamp: number,
    serverTimestamp: number,
    clientData: any,
    serverData: any
  ): boolean {
    // If server data was modified after client data, there's a potential conflict
    if (serverTimestamp > clientTimestamp) {
      // Check if data actually differs
      return JSON.stringify(clientData) !== JSON.stringify(serverData);
    }
    return false;
  }

  /**
   * Resolve a conflict using the specified strategy
   */
  public async resolveConflict(
    queueItem: SyncQueueItem,
    serverData: any,
    serverTimestamp: number,
    strategy: ConflictResolutionStrategy = 'last-write-wins'
  ): Promise<ConflictResolution> {
    const conflict: SyncConflict = {
      queueItemId: queueItem.id!,
      entity: queueItem.entity,
      entityId: queueItem.entityId || queueItem.clientId,
      clientData: queueItem.data,
      serverData: serverData,
      clientTimestamp: queueItem.timestamp,
      serverTimestamp: serverTimestamp
    };

    // Store conflict for potential manual resolution
    await offlineDb.conflicts.add(conflict);

    switch (strategy) {
      case 'last-write-wins':
        return this.lastWriteWins(queueItem, serverData, serverTimestamp);
      
      case 'server-wins':
        return this.serverWins(serverData);
      
      case 'client-wins':
        return this.clientWins(queueItem);
      
      case 'manual':
        return this.requireManualResolution(queueItem);
      
      default:
        return this.lastWriteWins(queueItem, serverData, serverTimestamp);
    }
  }

  /**
   * Last write wins strategy - use the most recent timestamp
   */
  private lastWriteWins(
    queueItem: SyncQueueItem,
    serverData: any,
    serverTimestamp: number
  ): ConflictResolution {
    if (queueItem.timestamp > serverTimestamp) {
      // Client data is newer, retry sync
      return {
        strategy: 'last-write-wins',
        resolvedData: queueItem.data,
        shouldRetry: true
      };
    } else {
      // Server data is newer, discard client changes
      return {
        strategy: 'last-write-wins',
        resolvedData: serverData,
        shouldRetry: false
      };
    }
  }

  /**
   * Server wins strategy - always use server data
   */
  private serverWins(serverData: any): ConflictResolution {
    return {
      strategy: 'server-wins',
      resolvedData: serverData,
      shouldRetry: false
    };
  }

  /**
   * Client wins strategy - always use client data
   */
  private clientWins(queueItem: SyncQueueItem): ConflictResolution {
    return {
      strategy: 'client-wins',
      resolvedData: queueItem.data,
      shouldRetry: true
    };
  }

  /**
   * Manual resolution required - mark for user intervention
   */
  private requireManualResolution(queueItem: SyncQueueItem): ConflictResolution {
    return {
      strategy: 'manual',
      resolvedData: null,
      shouldRetry: false
    };
  }

  /**
   * Get strategy for specific entity type
   */
  public getStrategyForEntity(entity: string): ConflictResolutionStrategy {
    switch (entity) {
      case 'attendance':
        // Attendance is time-sensitive, use last-write-wins
        return 'last-write-wins';
      
      case 'leave':
        // Leave requests should prefer server (approval status)
        return 'server-wins';
      
      case 'employee':
        // Employee updates should prefer server (admin changes)
        return 'server-wins';
      
      default:
        return 'last-write-wins';
    }
  }

  /**
   * Get all unresolved conflicts
   */
  public async getUnresolvedConflicts(): Promise<SyncConflict[]> {
    return await offlineDb.conflicts
      .where('resolvedAt')
      .equals(undefined as any)
      .toArray();
  }

  /**
   * Manually resolve a conflict
   */
  public async manuallyResolve(
    conflictId: number,
    resolution: 'client' | 'server',
    customData?: any
  ): Promise<void> {
    const conflict = await offlineDb.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    const resolvedData = customData || (resolution === 'client' ? conflict.clientData : conflict.serverData);

    // Update conflict record
    await offlineDb.conflicts.update(conflictId, {
      resolvedAt: Date.now(),
      resolution: resolution
    });

    // Update queue item to retry with resolved data
    const queueItem = await offlineDb.syncQueue.get(conflict.queueItemId);
    if (queueItem) {
      await offlineDb.syncQueue.update(conflict.queueItemId, {
        data: resolvedData,
        status: 'pending',
        retries: 0
      });
    }
  }

  /**
   * Merge client and server data (for complex objects)
   */
  public mergeData(clientData: any, serverData: any, preferClient: string[] = []): any {
    const merged = { ...serverData };
    
    // Override with client data for specified fields
    preferClient.forEach(field => {
      if (clientData[field] !== undefined) {
        merged[field] = clientData[field];
      }
    });
    
    return merged;
  }
}

// Singleton instance
export const conflictResolver = new ConflictResolver();

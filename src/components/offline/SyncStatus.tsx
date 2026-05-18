'use client';

import { useEffect, useState } from 'react';
import { syncManager, SyncEvent } from '@/hooks/offline/sync-manager';
import { networkDetector } from '@/hooks/offline/network-detector';

export function SyncStatus() {
  const [status, setStatus] = useState({
    pending: 0,
    syncing: 0,
    failed: 0,
    conflicts: 0
  });
  const [syncProgress, setSyncProgress] = useState<SyncEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial status
    loadStatus();
    setIsOnline(networkDetector.isOnline);

    // Subscribe to network changes
    const unsubscribeNetwork = networkDetector.subscribe((online) => {
      setIsOnline(online);
    });

    // Subscribe to sync events
    const unsubscribeSync = syncManager.subscribe((event) => {
      setSyncProgress(event);
      
      if (event.type === 'sync-complete' || event.type === 'sync-error') {
        loadStatus();
        // Clear progress after 3 seconds
        setTimeout(() => setSyncProgress(null), 3000);
      }
    });

    // Refresh status every 30 seconds
    const interval = setInterval(loadStatus, 30000);

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const loadStatus = async () => {
    try {
      const newStatus = await syncManager.getStatus();
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      console.warn('Cannot sync while offline');
      return;
    }
    await syncManager.syncAll();
  };

  const handleRetryFailed = async () => {
    if (!isOnline) {
      console.warn('Cannot retry while offline');
      return;
    }
    await syncManager.retryFailed();
  };

  const totalPending = status.pending + status.syncing + status.failed;

  if (totalPending === 0 && !syncProgress && status.conflicts === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-gray-900">Sync Status</h3>
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>

      {syncProgress && syncProgress.type === 'sync-progress' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Syncing...</span>
            <span>{syncProgress.synced} / {syncProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(syncProgress.synced / syncProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm">
        {status.pending > 0 && (
          <div className="flex justify-between text-gray-700">
            <span>Pending:</span>
            <span className="font-medium">{status.pending}</span>
          </div>
        )}
        
        {status.syncing > 0 && (
          <div className="flex justify-between text-blue-600">
            <span>Syncing:</span>
            <span className="font-medium">{status.syncing}</span>
          </div>
        )}
        
        {status.failed > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Failed:</span>
            <span className="font-medium">{status.failed}</span>
          </div>
        )}
        
        {status.conflicts > 0 && (
          <div className="flex justify-between text-orange-600">
            <span>Conflicts:</span>
            <span className="font-medium">{status.conflicts}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {isOnline && totalPending > 0 && (
          <button
            onClick={handleManualSync}
            className="flex-1 px-3 py-2 min-h-[44px] bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            Sinkronkan
          </button>
        )}
        
        {status.failed > 0 && (
          <button
            onClick={handleRetryFailed}
            className="flex-1 px-3 py-2 min-h-[44px] bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            Coba Lagi
          </button>
        )}
      </div>
    </div>
  );
}

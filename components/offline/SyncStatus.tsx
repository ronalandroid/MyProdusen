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
  const [feedback, setFeedback] = useState<string | null>(null);

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
    } catch {
      setFeedback('Status sinkronisasi belum bisa dimuat. Coba lagi sebentar.');
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      setFeedback('Tidak bisa sinkron saat offline. Periksa koneksi internet.');
      return;
    }

    setFeedback(null);
    await syncManager.syncAll();
  };

  const handleRetryFailed = async () => {
    if (!isOnline) {
      setFeedback('Tidak bisa mencoba ulang saat offline. Periksa koneksi internet.');
      return;
    }

    setFeedback(null);
    await syncManager.retryFailed();
  };

  const totalPending = status.pending + status.syncing + status.failed;

  if (totalPending === 0 && !syncProgress && status.conflicts === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg" role="status" aria-live="polite">
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

      {feedback && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          {feedback}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {isOnline && totalPending > 0 && (
          <button
            onClick={handleManualSync}
            className="min-h-11 flex-1 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Sync Now
          </button>
        )}
        
        {status.failed > 0 && (
          <button
            onClick={handleRetryFailed}
            className="min-h-11 flex-1 rounded bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2"
          >
            Retry Failed
          </button>
        )}
      </div>
    </div>
  );
}

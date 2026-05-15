'use client';

import { useEffect, useState } from 'react';
import { offlineDb, SyncQueueItem } from '@/hooks/offline/db';

export function SyncQueue() {
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadQueue();
    }
  }, [isOpen]);

  const loadQueue = async () => {
    try {
      const items = await offlineDb.syncQueue
        .orderBy('timestamp')
        .reverse()
        .limit(50)
        .toArray();
      setQueueItems(items);
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'synced': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'conflict': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-gray-700"
      >
        View Queue
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Sync Queue</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {queueItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items in queue
            </div>
          ) : (
            <div className="space-y-3">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {item.entity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.operation}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(item.timestamp)}
                      </div>
                    </div>
                    {item.retries > 0 && (
                      <div className="text-xs text-orange-600">
                        Retries: {item.retries}
                      </div>
                    )}
                  </div>

                  {item.lastError && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      {item.lastError}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-400 font-mono">
                    ID: {item.clientId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={() => {
              loadQueue();
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

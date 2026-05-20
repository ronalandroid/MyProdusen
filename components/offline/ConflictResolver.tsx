'use client';

import { useEffect, useState } from 'react';
import { offlineDb, SyncConflict } from '@/hooks/offline/db';
import { conflictResolver } from '@/hooks/offline/conflict-resolver';

export function ConflictResolver() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadConflicts();
    
    // Check for conflicts every minute
    const interval = setInterval(loadConflicts, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadConflicts = async () => {
    try {
      const unresolved = await conflictResolver.getUnresolvedConflicts();
      setConflicts(unresolved);
      
      // Auto-open if there are new conflicts
      if (unresolved.length > 0 && !isOpen) {
        setIsOpen(true);
      }
    } catch {
      setFeedback('Konflik sinkronisasi belum bisa dimuat. Coba lagi sebentar.');
    }
  };

  const handleResolve = async (conflictId: number, resolution: 'client' | 'server') => {
    try {
      await conflictResolver.manuallyResolve(conflictId, resolution);
      await loadConflicts();
      setSelectedConflict(null);
      setFeedback('Konflik berhasil diselesaikan.');
      
      // Close if no more conflicts
      if (conflicts.length <= 1) {
        setIsOpen(false);
      }
    } catch {
      setFeedback('Konflik belum bisa diselesaikan. Coba ulangi.');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (conflicts.length === 0) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 right-4 z-40 min-h-11 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2"
      >
        {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" role="dialog" aria-modal="true" aria-labelledby="sync-conflicts-title">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b bg-orange-50">
          <div>
            <h2 id="sync-conflicts-title" className="text-lg font-semibold text-gray-900">Sync Conflicts</h2>
            <p className="text-sm text-gray-600">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} resolution
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="min-h-11 min-w-11 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Tutup konflik sinkronisasi"
          >
            ✕
          </button>
        </div>

        {feedback && (
          <p className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900" role="status">
            {feedback}
          </p>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {selectedConflict ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedConflict(null)}
                className="min-h-11 rounded-md px-2 text-sm font-medium text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                ← Back to list
              </button>

              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {selectedConflict.entity} - {selectedConflict.entityId}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose which version to keep
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900">Your Changes</h4>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(selectedConflict.clientTimestamp)}
                      </span>
                    </div>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-48">
                      {JSON.stringify(selectedConflict.clientData, null, 2)}
                    </pre>
                    <button
                      onClick={() => handleResolve(selectedConflict.id!, 'client')}
                      className="mt-3 min-h-11 w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    >
                      Use My Changes
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900">Server Version</h4>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(selectedConflict.serverTimestamp)}
                      </span>
                    </div>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-48">
                      {JSON.stringify(selectedConflict.serverData, null, 2)}
                    </pre>
                    <button
                      onClick={() => handleResolve(selectedConflict.id!, 'server')}
                      className="mt-3 min-h-11 w-full rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                    >
                      Use Server Version
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="border border-orange-200 rounded-lg p-4 bg-orange-50 hover:bg-orange-100 cursor-pointer"
                  onClick={() => setSelectedConflict(conflict)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 mb-1">
                        {conflict.entity} - {conflict.entityId}
                      </div>
                      <div className="text-xs text-gray-600">
                        Client: {formatTimestamp(conflict.clientTimestamp)} • 
                        Server: {formatTimestamp(conflict.serverTimestamp)}
                      </div>
                    </div>
                    <div className="text-orange-600 text-sm">→</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!selectedConflict && (
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Click on a conflict to review and resolve it
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

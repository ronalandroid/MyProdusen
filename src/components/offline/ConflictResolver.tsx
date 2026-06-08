'use client';

import { useEffect, useRef, useState } from 'react';
import { offlineDb, SyncConflict } from '@/hooks/offline/db';
import { conflictResolver } from '@/hooks/offline/conflict-resolver';

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


export function ConflictResolver() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadConflicts();
    
    // Check for conflicts every minute
    const interval = setInterval(loadConflicts, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const loadConflicts = async () => {
    try {
      const unresolved = await conflictResolver.getUnresolvedConflicts();
      setConflicts(unresolved);
      
      // Auto-open if there are new conflicts
      if (unresolved.length > 0 && !isOpen) {
        setIsOpen(true);
      }
    } catch (error) {
      // Safe UI-only fallback; technical details stay out of user-visible output.
    }
  };

  const handleResolve = async (conflictId: number, resolution: 'client' | 'server') => {
    try {
      await conflictResolver.manuallyResolve(conflictId, resolution);
      await loadConflicts();
      setSelectedConflict(null);
      
      // Close if no more conflicts
      if (conflicts.length <= 1) {
        setIsOpen(false);
      }
    } catch (error) {
      // Safe UI-only fallback; technical details stay out of user-visible output.
    }
  };

  if (conflicts.length === 0) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 right-4 z-40 bg-orange-600 text-white px-4 py-2 min-h-[44px] rounded-lg shadow-lg text-sm font-medium hover:bg-orange-700 animate-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      >
        {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="conflict-resolver-title">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-orange-50">
          <div>
            <h2 id="conflict-resolver-title" className="text-lg font-semibold text-gray-900">Sync Conflicts</h2>
            <p className="text-sm text-gray-600">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} resolution
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsOpen(false)}
            className="min-h-[44px] min-w-[44px] rounded-lg text-gray-500 hover:text-gray-700 hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Tutup konflik sinkronisasi"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedConflict ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setSelectedConflict(null)}
                className="min-h-[44px] rounded-lg px-2 text-sm text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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

                <div className="grid grid-cols-2 gap-4">
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
                      type="button"
                      onClick={() => handleResolve(selectedConflict.id!, 'client')}
                      className="mt-3 w-full px-4 py-2 min-h-[44px] bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
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
                      type="button"
                      onClick={() => handleResolve(selectedConflict.id!, 'server')}
                      className="mt-3 w-full px-4 py-2 min-h-[44px] bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
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
                <button
                  type="button"
                  key={conflict.id}
                  className="w-full border border-orange-200 rounded-lg p-4 bg-orange-50 hover:bg-orange-100 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
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
                </button>
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

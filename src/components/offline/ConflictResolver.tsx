'use client';

import { useEffect, useState } from 'react';
import { offlineDb, SyncConflict } from '@/hooks/offline/db';
import { conflictResolver } from '@/hooks/offline/conflict-resolver';

export function ConflictResolver() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
    } catch (error) {
      console.error('Failed to load conflicts:', error);
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
      console.error('Failed to resolve conflict:', error);
      alert('Failed to resolve conflict');
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
        className="fixed bottom-36 right-4 z-40 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-orange-700 animate-pulse"
      >
        {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-orange-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sync Conflicts</h2>
            <p className="text-sm text-gray-600">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} resolution
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedConflict ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedConflict(null)}
                className="text-sm text-blue-600 hover:text-blue-700"
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
                      onClick={() => handleResolve(selectedConflict.id!, 'client')}
                      className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
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
                      className="mt-3 w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
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

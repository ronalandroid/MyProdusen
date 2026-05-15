'use client';

import { useEffect, useState } from 'react';
import { networkDetector } from '@/hooks/offline/network-detector';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setIsOnline(networkDetector.isOnline);

    const unsubscribe = networkDetector.subscribe((online) => {
      setIsOnline(online);
      setShowBanner(true);
      
      // Auto-hide banner after 5 seconds when coming back online
      if (online) {
        setTimeout(() => setShowBanner(false), 5000);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isOnline && !showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium ${
        isOnline
          ? 'bg-green-600 text-white'
          : 'bg-yellow-500 text-gray-900'
      }`}
    >
      {isOnline ? (
        <span>✓ Back online - Syncing data...</span>
      ) : (
        <span>⚠ You are offline - Changes will be synced when connection is restored</span>
      )}
    </div>
  );
}

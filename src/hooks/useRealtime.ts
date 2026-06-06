'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeEvent, RealtimeEventType } from '@/lib/realtime/events';

interface UseRealtimeOptions {
  enabled?: boolean;
  onEvent?: (event: RealtimeEvent) => void;
  eventTypes?: RealtimeEventType[];
}

const DEFAULT_REALTIME_EVENT_TYPES: RealtimeEventType[] = [
  'notification.created',
  'notification.read',
  'attendance.updated',
  'dashboard.updated',
  'sync.updated',
];

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { enabled = true, onEvent, eventTypes } = options;
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const onEventRef = useRef(onEvent);
  const eventTypesKey = eventTypes?.join('|') || '';
  const subscribedTypes = useMemo(
    () => eventTypesKey ? eventTypesKey.split('|') as RealtimeEventType[] : DEFAULT_REALTIME_EVENT_TYPES,
    [eventTypesKey],
  );

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const source = new EventSource('/api/realtime');
    const handleEvent = (message: MessageEvent) => {
      const event = JSON.parse(message.data) as RealtimeEvent;
      setLastEvent(event);
      onEventRef.current?.(event);
    };

    source.addEventListener('connected', () => setConnected(true));
    source.addEventListener('error', () => setConnected(false));
    source.addEventListener('heartbeat', () => setConnected(true));

    for (const type of subscribedTypes) {
      source.addEventListener(type, handleEvent as EventListener);
    }

    return () => {
      for (const type of subscribedTypes) {
        source.removeEventListener(type, handleEvent as EventListener);
      }
      source.close();
      setConnected(false);
    };
  }, [enabled, subscribedTypes]);

  return { connected, lastEvent };
}

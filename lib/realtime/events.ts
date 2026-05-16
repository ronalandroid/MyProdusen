export const REALTIME_CHANNEL = 'myprodusen:realtime';

export type RealtimeEventType =
  | 'notification.created'
  | 'notification.read'
  | 'attendance.updated'
  | 'dashboard.updated'
  | 'sync.updated'
  | 'heartbeat';

export interface RealtimeEvent<TPayload = unknown> {
  id: string;
  type: RealtimeEventType;
  scope: 'user' | 'role' | 'global';
  target?: string;
  payload: TPayload;
  createdAt: string;
}

export function createRealtimeEvent<TPayload>(input: Omit<RealtimeEvent<TPayload>, 'id' | 'createdAt'>): RealtimeEvent<TPayload> {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
}

export function canReceiveRealtimeEvent(event: RealtimeEvent, user: { userId: string; role: string }) {
  if (event.scope === 'global') return true;
  if (event.scope === 'user') return event.target === user.userId;
  if (event.scope === 'role') return event.target === user.role;
  return false;
}

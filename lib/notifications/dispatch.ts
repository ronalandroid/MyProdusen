import { v4 as uuidv4 } from 'uuid';
import { db, notifications, employees, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';

export interface NotificationPayload {
  /** Either employeeId (resolved to userId) or userId directly. */
  employeeId?: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
}

/**
 * Persist a notification row for the affected user. Best-effort:
 * notification failures must not block the originating mutation.
 */
export async function notifyUser(payload: NotificationPayload): Promise<void> {
  try {
    let targetUserId = payload.userId;

    if (!targetUserId && payload.employeeId) {
      const [employee] = await db
        .select({ userId: employees.userId })
        .from(employees)
        .where(eq(employees.id, payload.employeeId))
        .limit(1);
      targetUserId = employee?.userId;
    }

    if (!targetUserId) return;

    const id = uuidv4();
    await db.insert(notifications).values({
      id,
      userId: targetUserId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
    });

    await publishRealtimeEvent(
      createRealtimeEvent({
        type: 'notification.created',
        scope: 'user',
        target: targetUserId,
        payload: { id, title: payload.title },
      }),
    ).catch(() => undefined);
  } catch {
    // Silenced on purpose — caller should not fail because of a notification.
  }
}

/**
 * Broadcast one notification to every active user (company-wide announcements,
 * policy updates, etc.). Bulk-inserts a row per user, then publishes a single
 * global realtime event so all connected clients refresh their notification
 * badge instantly. Best-effort: never blocks the originating mutation.
 */
export async function notifyAllActiveUsers(payload: {
  title: string;
  message: string;
  type: string;
}): Promise<void> {
  try {
    const activeUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isActive, true));

    if (activeUsers.length === 0) return;

    const rows = activeUsers.map((u) => ({
      id: uuidv4(),
      userId: u.id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
    }));

    await db.insert(notifications).values(rows);

    await publishRealtimeEvent(
      createRealtimeEvent({
        type: 'notification.created',
        scope: 'global',
        payload: { title: payload.title, broadcast: true },
      }),
    ).catch(() => undefined);
  } catch {
    // Silenced on purpose — announcement creation must not fail on notify.
  }
}

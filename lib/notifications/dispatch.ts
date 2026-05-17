import { v4 as uuidv4 } from 'uuid';
import { db, notifications, employees } from '@/lib/db';
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

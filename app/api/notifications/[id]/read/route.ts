import { NextRequest } from 'next/server';
import { db, notifications } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse } from '@/utils/response';
import { and, eq } from 'drizzle-orm';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { AppError } from '@/lib/core/app-error';
import { withApiHandler } from '@/lib/core/route-handler';

export const PATCH = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);
  const { id } = await params;

  const [notification] = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.userId)))
    .limit(1);

  if (!notification) {
    throw AppError.notFound('Notifikasi tidak ditemukan');
  }

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.userId)))
    .returning();

  await publishRealtimeEvent(createRealtimeEvent({
    type: 'notification.read',
    scope: 'user',
    target: user.userId,
    payload: { id },
  }));

  return successResponse(updated, 'Notifikasi ditandai sudah dibaca');
});

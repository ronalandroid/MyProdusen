import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { successResponse } from '@/utils/response';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { withApiHandler } from '@/lib/core/route-handler';
import { notificationService } from '@/features/notifications/notification.service';

export const PATCH = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);
  const { id } = await params;

  const updated = await notificationService.markAsRead(id, user.userId);

  await publishRealtimeEvent(createRealtimeEvent({
    type: 'notification.read',
    scope: 'user',
    target: user.userId,
    payload: { id },
  }));

  return successResponse(updated, 'Notifikasi ditandai sudah dibaca');
});

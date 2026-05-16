import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { notificationService } from '@/features/notifications/notification.service';
import { successResponse } from '@/utils/response';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { withApiHandler } from '@/lib/core/route-handler';

export const POST = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const count = await notificationService.markAllAsRead(user.userId);

  await publishRealtimeEvent(createRealtimeEvent({
    type: 'notification.read',
    scope: 'user',
    target: user.userId,
    payload: { count },
  }));

  return successResponse({ count }, `${count} notifikasi ditandai sebagai dibaca`);
});

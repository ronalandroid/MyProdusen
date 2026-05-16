import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { notificationService } from '@/features/notifications/notification.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const count = await notificationService.markAllAsRead(user.userId);

    await publishRealtimeEvent(createRealtimeEvent({
      type: 'notification.read',
      scope: 'user',
      target: user.userId,
      payload: { count },
    }));

    return successResponse({ count }, `${count} notifikasi ditandai sebagai dibaca`);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menandai semua notifikasi sebagai dibaca');
  }
}

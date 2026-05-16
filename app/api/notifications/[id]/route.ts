import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { notificationService } from '@/features/notifications/notification.service';
import { successResponse } from '@/utils/response';
import { withApiHandler } from '@/lib/core/route-handler';

export const DELETE = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);
  const { id } = await params;
  const deleted = await notificationService.deleteNotification(id, user.userId);

  return successResponse(deleted, 'Notifikasi berhasil dihapus');
});

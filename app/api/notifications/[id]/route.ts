import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { notificationService } from '@/features/notifications/notification.service';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    
    const deleted = await notificationService.deleteNotification(id, user.userId);

    return successResponse(deleted, 'Notifikasi berhasil dihapus');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.message.includes('tidak memiliki akses')) return forbiddenResponse(error.message);
    return errorResponse(error.message || 'Gagal menghapus notifikasi');
  }
}

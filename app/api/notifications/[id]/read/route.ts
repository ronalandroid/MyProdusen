import { NextRequest } from 'next/server';
import { db, notifications } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/utils/response';
import { and, eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.userId)))
      .limit(1);

    if (!notification) {
      return notFoundResponse('Notifikasi tidak ditemukan');
    }

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.userId)))
      .returning();

    return successResponse(updated, 'Notifikasi ditandai sudah dibaca');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal memperbarui notifikasi');
  }
}

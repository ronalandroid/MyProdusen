import { NextRequest } from 'next/server';
import { db, notifications } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { and, desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const rows = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, user.userId),
          unreadOnly ? eq(notifications.isRead, false) : undefined
        )
      )
      .orderBy(desc(notifications.createdAt));

    return successResponse(rows);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil notifikasi');
  }
}

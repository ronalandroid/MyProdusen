import { NextRequest } from 'next/server';
import { db, notifications } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { and, desc, eq, sql } from 'drizzle-orm';
import { parsePagination, paginated } from '@/lib/api/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const pagination = parsePagination(searchParams);

    const whereClause = and(
      eq(notifications.userId, user.userId),
      unreadOnly ? eq(notifications.isRead, false) : undefined
    );

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(whereClause);

    const rows = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const result = paginated(rows, totalResult?.count || 0, pagination);
    const response = successResponse(result.items);
    response.headers.set('X-Pagination', JSON.stringify(result.pagination));
    return response;
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil notifikasi');
  }
}

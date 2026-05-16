import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { successResponse } from '@/utils/response';
import { parsePagination, paginated } from '@/lib/api/pagination';
import { notificationService } from '@/features/notifications/notification.service';
import { withApiHandler } from '@/lib/core/route-handler';

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const pagination = parsePagination(searchParams);

  const { rows, total } = await notificationService.listForUser(user.userId, {
    unreadOnly,
    limit: pagination.limit,
    offset: pagination.offset,
  });

  const result = paginated(rows, total, pagination);
  const response = successResponse(result.items);
  response.headers.set('X-Pagination', JSON.stringify(result.pagination));

  return response;
});
